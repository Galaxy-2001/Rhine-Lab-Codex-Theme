# Rhine Lab DSH theme

A DeepSeek Harness port of the Rhine Lab Codex theme. The central chat background now shares Codex 1.1.0’s 14-second folded ribbon rotation, lighting and flattening sequence. The plus grows and rotates 90 degrees; the minus expands horizontally. The six-second moving gap and STRU archive labels remain. Backgrounds do not reserve chat or composer space.

![DSH 1.2.1 central animation](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/docs/media/central-animation.gif)

![DSH 1.2.1 light artwork preview](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-chat-light-1.2.1.png)

![DSH 1.2.1 dark artwork preview](https://raw.githubusercontent.com/Galaxy-2001/Rhine-Lab-Codex-Theme/main/dsh/docs/market/dsh-chat-dark-1.2.1.png)

The UI previews are illustrations rendered from released assets, not client screenshots. The GIF renders the released SVG animation. This is an original vector reconstruction, not an official video clip or frame-exact reproduction.

Get the plugin tarball from the [DSH 1.2.1 release](https://github.com/Galaxy-2001/Rhine-Lab-Codex-Theme/releases/tag/dsh-v1.2.1). The Skin ZIP is for manual installation with Skin Center already present; the Source ZIP is for development.

Download `dsh-plugin-rhine-lab-theme-1.2.1.tgz`. In official DSH Desktop, open Plugins > Add plugin, enter the tarball's absolute local path and install. After installation, click Enable now. The plugin declares Skin Center as a dependency, installs its artwork on first activation and selects Rhine Lab automatically. Later launches preserve your choices. Keep using the ordinary DSH application shortcut. The package has not been published to npm yet.

For Web, run `dsh plugin --profile web add "C:\Downloads\dsh-plugin-rhine-lab-theme-1.2.1.tgz"`, then start the host with `dsh web`. A refused connection at port 3080 means the host is not running; installing a theme does not start a persistent web host. Do not use the ordinary CLI to mutate Desktop's reserved profile.

For an asset-only installation with Skin Center already present, copy the Skin ZIP's `rhine-lab` directory into `$DSH_HOME/skins/` and select Rhine Lab in Settings > Skin Center.

The Source ZIP also contains a Node.js installer: `node scripts/install.mjs`. Updates back up the previous skin. The installer respects `DSH_SKINS_HOME`, `DSH_SKINS_DIR` and `DSH_HOME`, and leaves the current selection unchanged. Select the skin in the GUI afterwards.

For a web profile without the loader:

```text
dsh plugin --profile web add @linxin666/dsh-client-ui-skin-center@0.4.5
```

Restart the host yourself after adding the loader. DSH Desktop manages its own profile: install the package through its plugin manager. Subsequent asset installation and skin switching do not need a host restart.

Targets DSH 0.2.0-rc.2 with Skin Center 0.4.5. DSH includes prereleases in its runtime compatibility check; no exemption is needed. Development dependencies use 0.1.7-rc.1 to satisfy npm's default peer resolution. Using the skin does not require downgrading DSH. See the validation record for tested coverage.

This is a v2 asset skin, with L1 tokens and L2 semantic surfaces. It contains no executable hooks, remote assets or client patcher. SVG animation follows reduced-motion preferences. Skin Center owns background switches and blur controls.

Choose Official default in Skin Center to restore the original appearance. Then remove `$DSH_HOME/skins/rhine-lab` if you want to uninstall the assets.

Development: `npm ci --ignore-scripts`, `npm test`, `npm run generate`, `npm run build`. The installable plugin TGZ, asset and source ZIPs, and SHA-256 sums appear in `dist/`. See [validation](docs/VALIDATION.md) for tested coverage. The theme is not listed in the DSH Workshop yet.

Theme code is MIT licensed. Rhine Lab and related Arknights marks belong to their rights holders. This is an unofficial fan theme; its code licence does not grant brand rights.

## 1.2.1 update

Off-peak billing periods use blue with stripes, peak periods use amber, and weekends use green. Dark chat text, cards and background artwork are softer. Billing logic is unchanged.

## Contributions and acknowledgements

- **[Galaxy-2001](https://github.com/Galaxy-2001)**: project initiator and maintainer; design direction, requirements, reference materials, hands-on validation, visual feedback and release decisions.
- **OpenAI Codex (AI development assistant)**: implemented most of the code under the maintainer's direction and feedback, and contributed to visual design, 3D SVG animation, Codex and DSH integration, fixes, testing, packaging, documentation, demo materials, GitHub releases and the marketplace submission.

The project was developed collaboratively by its maintainer and an AI assistant. This credit records development contributions and does not imply an official OpenAI project or endorsement.
