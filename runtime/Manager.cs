using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Drawing;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Web.Script.Serialization;

class RhineManager : ApplicationContext {
  public const string AppId="RhineLab.Codex.Theme";
  readonly string root=AppDomain.CurrentDomain.BaseDirectory;
  readonly string state=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"RhineLabTheme7");
  NotifyIcon icon; System.Windows.Forms.Timer timer; HashSet<IntPtr> bound=new HashSet<IntPtr>(); bool busy; string lastBindingError;
  [STAThread] static void Main(string[] args) {
    try {
      if(args.Length==3 && args[0]=="--make-link") { MakeLink(args[1],args[2]);return; }
      if(args.Length==4 && args[0]=="--make-official-link") { MakeOfficialLink(args[1],args[2],args[3]);return; }
      bool fresh;using(var mutex=new Mutex(true,"Local\\RhineLabThemeManager7",out fresh)) {
        if(!fresh) {
          using(var process=Process.Start(new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy RemoteSigned -WindowStyle Hidden -File \""+Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"theme.ps1")+"\" -Action start"){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden})) {
            process.WaitForExit();if(process.ExitCode==0)ShowOfficialWindow();
          }
          return;
        }
        Application.EnableVisualStyles();Application.Run(new RhineManager());
      }
    } catch(Exception e) { Environment.ExitCode=1;if(args.Length>0)Console.Error.WriteLine(e.Message);else MessageBox.Show(e.Message,"莱茵生命主题"); }
  }
  RhineManager() {
    var menu=new ContextMenuStrip();
    menu.Items.Add("应用莱茵生命主题",null,(s,e)=>Run("enable"));
    menu.Items.Add("暂停主题",null,(s,e)=>Run("disable"));
    menu.Items.Add("开启缺口动画",null,(s,e)=>Run("motion-on"));
    menu.Items.Add("暂停缺口动画",null,(s,e)=>Run("motion-off"));
    menu.Items.Add(new ToolStripSeparator());
    menu.Items.Add("恢复官方外观与桌面入口",null,(s,e)=>Run("restore"));
    menu.Items.Add("打开主题文件夹",null,(s,e)=>Process.Start(root));
    menu.Items.Add("退出主题管理",null,(s,e)=>{icon.Visible=false;Application.Exit();});
    string iconFile=Path.Combine(root,"assets","codex-white.ico");
    icon=new NotifyIcon{Icon=File.Exists(iconFile)?new Icon(iconFile):SystemIcons.Application,Text="莱茵生命 · Codex 主题",ContextMenuStrip=menu,Visible=true};
    icon.DoubleClick+=(s,e)=>Run("start");
    timer=new System.Windows.Forms.Timer{Interval=1500};timer.Tick+=(s,e)=>BindOfficialWindows();timer.Start();Run("start");
  }
  void Run(string action) {
    if(busy)return;busy=true;
    Task.Factory.StartNew(()=>{
      string failure=null;
      try {
        var info=new ProcessStartInfo("powershell.exe","-NoProfile -ExecutionPolicy RemoteSigned -WindowStyle Hidden -File \""+Path.Combine(root,"theme.ps1")+"\" -Action "+action){UseShellExecute=false,CreateNoWindow=true,WindowStyle=ProcessWindowStyle.Hidden};
        using(var process=Process.Start(info)) {
          process.WaitForExit();
          Directory.CreateDirectory(state);File.AppendAllText(Path.Combine(state,"manager.log"),DateTime.Now.ToString("s")+" "+action+" exit="+process.ExitCode+"\n");
          if(process.ExitCode!=0)failure="主题操作未完成，请查看主题文件夹中的日志。";
          else if(action=="start"||action=="enable")ShowOfficialWindow();
        }
      }catch(Exception e){failure=e.Message;}
      busy=false;
      if(failure!=null)icon.ShowBalloonTip(5000,"莱茵生命主题",failure,ToolTipIcon.Warning);
      if(action=="restore"&&failure==null){icon.Visible=false;Application.Exit();}
    });
  }
  static void ShowOfficialWindow() {
    try {
      string stateRoot=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"RhineLabTheme7");
      using(var process=GetThemeProcess(stateRoot)){
        if(process==null||process.MainWindowHandle==IntPtr.Zero)return;
        ShowWindowAsync(process.MainWindowHandle,IsIconic(process.MainWindowHandle)?9:5);
        bool foreground=SetForegroundWindow(process.MainWindowHandle);
        File.WriteAllText(Path.Combine(stateRoot,"window-focus.json"),new JavaScriptSerializer().Serialize(new{pid=process.Id,window=process.MainWindowHandle.ToInt64(),foreground=foreground}));
      }
    }catch{}
  }
  static Process GetThemeProcess(string stateRoot) {
    string file=Path.Combine(stateRoot,"session.json");if(!File.Exists(file))return null;
    var session=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(file));
    if(!session.ContainsKey("mainProcess"))return null;
    var identity=(Dictionary<string,object>)session["mainProcess"];
    var process=Process.GetProcessById(Convert.ToInt32(identity["id"]));
    string executable=(string)((Dictionary<string,object>)session["official"])["Executable"];
    if(process.StartTime.ToUniversalTime().Ticks!=Convert.ToInt64(identity["startedAtUtcTicks"])||!String.Equals(process.MainModule.FileName,executable,StringComparison.OrdinalIgnoreCase)){
      process.Dispose();throw new Exception("The verified theme process changed.");
    }
    return process;
  }
  void BindOfficialWindows() {
    try {
      string preferences=Path.Combine(state,"preferences.json");
      if(File.Exists(preferences)){var config=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(preferences));if(config.ContainsKey("restored")&&(bool)config["restored"])return;}
      string file=Path.Combine(state,"session.json");if(!File.Exists(file))return;
      var session=new JavaScriptSerializer().Deserialize<Dictionary<string,object>>(File.ReadAllText(file));
      var official=(Dictionary<string,object>)session["official"];string executable=(string)official["Executable"];
      using(var themed=GetThemeProcess(state)){
        if(themed==null)return;
        ReleaseUnthemedWindows(executable,(string)official["AppUserModelId"],themed.Id);
        var process=themed;
        try {if(process.MainWindowHandle!=IntPtr.Zero && !bound.Contains(process.MainWindowHandle)){
          IPropertyStore store;Guid iid=typeof(IPropertyStore).GUID;Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(process.MainWindowHandle,ref iid,out store));
          string iconResource=Path.Combine(root,"assets","codex-white.ico")+",0";
          Set(store,2,"\""+Path.Combine(root,"RhineLabTheme.exe")+"\"");Set(store,4,"Codex");Set(store,3,iconResource);Set(store,5,AppId);Marshal.ThrowExceptionForHR(store.Commit());
          var key=new PropertyKey{format=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=5};PropVariant current;Marshal.ThrowExceptionForHR(store.GetValue(ref key,out current));string value=Marshal.PtrToStringUni(current.pointer);Marshal.FreeCoTaskMem(current.pointer);
          if(value!=AppId)throw new Exception("Taskbar window identity was not applied: type="+current.type+", value="+value);
          Directory.CreateDirectory(state);File.WriteAllText(Path.Combine(state,"window-binding.json"),new JavaScriptSerializer().Serialize(new{pid=process.Id,window=process.MainWindowHandle.ToInt64(),appId=value,relaunch=Path.Combine(root,"RhineLabTheme.exe"),icon=iconResource}));
          Marshal.ReleaseComObject(store);bound.Add(process.MainWindowHandle);
        }}catch(Exception error){if(error.Message!=lastBindingError){lastBindingError=error.Message;Directory.CreateDirectory(state);File.WriteAllText(Path.Combine(state,"window-binding-error.log"),error.ToString());}}
      }
    }catch{}
  }
  void ReleaseUnthemedWindows(string executable,string originalAppId,int themedPid) {
    foreach(var process in Process.GetProcessesByName("ChatGPT"))using(process){
      try {
        if(process.Id==themedPid||process.MainWindowHandle==IntPtr.Zero||!String.Equals(process.MainModule.FileName,executable,StringComparison.OrdinalIgnoreCase))continue;
        IPropertyStore store;Guid iid=typeof(IPropertyStore).GUID;Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(process.MainWindowHandle,ref iid,out store));
        try {
          var key=new PropertyKey{format=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=5};PropVariant current;Marshal.ThrowExceptionForHR(store.GetValue(ref key,out current));
          string value=current.type==31?Marshal.PtrToStringUni(current.pointer):null;if(current.type==31)Marshal.FreeCoTaskMem(current.pointer);
          if(value!=AppId)continue;
          foreach(uint id in new uint[]{2,3,4}){key.id=id;var empty=new PropVariant();Marshal.ThrowExceptionForHR(store.SetValue(ref key,ref empty));}
          Set(store,5,originalAppId);Marshal.ThrowExceptionForHR(store.Commit());
          key.id=5;Marshal.ThrowExceptionForHR(store.GetValue(ref key,out current));string restored=Marshal.PtrToStringUni(current.pointer);Marshal.FreeCoTaskMem(current.pointer);
          if(restored!=originalAppId)throw new Exception("The ordinary official window identity was not restored.");
          File.WriteAllText(Path.Combine(state,"unmanaged-window-restored.json"),new JavaScriptSerializer().Serialize(new{pid=process.Id,appId=restored}));
        }finally{Marshal.ReleaseComObject(store);}
      }catch(Exception error){File.WriteAllText(Path.Combine(state,"unmanaged-window-error.log"),error.ToString());}
    }
  }
  static void MakeLink(string filename,string target) {
    var link=(IShellLinkW)new ShellLink();link.SetPath(target);link.SetWorkingDirectory(Path.GetDirectoryName(target));link.SetDescription("Codex · 莱茵生命主题");link.SetIconLocation(Path.Combine(Path.GetDirectoryName(target),"assets","codex-white.ico"),0);
    var store=(IPropertyStore)link;Set(store,5,AppId);store.Commit();((IPersistFile)link).Save(filename,true);Marshal.ReleaseComObject(link);
  }
  static void Set(IPropertyStore store,uint id,string value) {
    var key=new PropertyKey{format=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),id=id};
    var variant=new PropVariant{type=31,pointer=Marshal.StringToCoTaskMemUni(value)};
    try{Marshal.ThrowExceptionForHR(store.SetValue(ref key,ref variant));}finally{Marshal.FreeCoTaskMem(variant.pointer);}
  }
  static void MakeOfficialLink(string filename,string appId,string iconFile) {
    if(appId!="OpenAI.Codex_2p2nqsd0c76g0!App")throw new Exception("Unexpected official application identity.");
    var link=(IShellLinkW)new ShellLink();
    link.SetPath(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"explorer.exe"));
    link.SetArguments("shell:AppsFolder\\"+appId);link.SetDescription("ChatGPT / Codex");link.SetIconLocation(iconFile,0);
    var store=(IPropertyStore)link;Set(store,5,appId);Marshal.ThrowExceptionForHR(store.Commit());
    ((IPersistFile)link).Save(filename,true);Marshal.ReleaseComObject(link);
  }
  [DllImport("shell32.dll")]static extern int SHGetPropertyStoreForWindow(IntPtr window,ref Guid iid,out IPropertyStore store);
  [DllImport("user32.dll")]static extern bool ShowWindowAsync(IntPtr window,int command);
  [DllImport("user32.dll")]static extern bool IsIconic(IntPtr window);
  [DllImport("user32.dll")]static extern bool SetForegroundWindow(IntPtr window);
  [StructLayout(LayoutKind.Sequential)]struct PropertyKey{public Guid format;public uint id;}
  [StructLayout(LayoutKind.Explicit,Size=24)]struct PropVariant{[FieldOffset(0)]public ushort type;[FieldOffset(8)]public IntPtr pointer;}
  [ComImport,Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]interface IPropertyStore{
    [PreserveSig]int GetCount(out uint count);[PreserveSig]int GetAt(uint index,out PropertyKey key);[PreserveSig]int GetValue(ref PropertyKey key,out PropVariant value);[PreserveSig]int SetValue(ref PropertyKey key,ref PropVariant value);[PreserveSig]int Commit();
  }
  [ComImport,Guid("00021401-0000-0000-C000-000000000046")]class ShellLink{}
  [ComImport,Guid("000214F9-0000-0000-C000-000000000046"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]interface IShellLinkW{
    void GetPath(IntPtr file,int max,IntPtr data,uint flags);void GetIDList(out IntPtr list);void SetIDList(IntPtr list);void GetDescription(IntPtr text,int max);void SetDescription([MarshalAs(UnmanagedType.LPWStr)]string text);void GetWorkingDirectory(IntPtr text,int max);void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)]string text);void GetArguments(IntPtr text,int max);void SetArguments([MarshalAs(UnmanagedType.LPWStr)]string text);void GetHotkey(out short key);void SetHotkey(short key);void GetShowCmd(out int command);void SetShowCmd(int command);void GetIconLocation(IntPtr text,int max,out int index);void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)]string text,int index);void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)]string path,uint reserved);void Resolve(IntPtr window,uint flags);void SetPath([MarshalAs(UnmanagedType.LPWStr)]string path);
  }
}
