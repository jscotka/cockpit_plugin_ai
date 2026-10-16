# NetworkManager editor (PoC)

This is an independent, standalone Cockpit example. It uses
`cockpit.dbus("org.freedesktop.NetworkManager", { superuser: "require" })`
to call NetworkManager's system D-Bus service directly. It does not use
`nmcli`, a shell, or Cockpit's NetworkManager package.

## Requirements and scope

The host needs Cockpit, NetworkManager, and a user who can obtain the
administrator authorization required for the system NetworkManager D-Bus
service. The browser must be able to load `../base1/cockpit.js` from the
Cockpit installation. The build requires Node.js 22 or newer and npm 10 or
newer.

NetworkManager must provide the D-Bus interfaces used by this example:

* `org.freedesktop.NetworkManager` and its `GetAllDevices`, `Version`,
  `ActivateConnection`, `DeactivateConnection`, and checkpoint methods;
* `org.freedesktop.NetworkManager.Settings` with `ListConnections` and
  `AddConnection2`; and
* `org.freedesktop.NetworkManager.Settings.Connection` with `GetSettings`,
  `Update2`, and `Delete`.

`AddConnection2` is documented by NetworkManager as available since 1.20.
The example reads NetworkManager's `Version` property but does not enforce a
numeric version check. Activation additionally requires working
`CheckpointCreate`, `CheckpointRollback`, and `CheckpointDestroy` methods;
when checkpoint support is unavailable, **Activate** is disabled while profile
editing remains available if the other calls work.

This PoC discovers saved profiles, Ethernet/Wi-Fi devices, active
connections, and nearby access points. Only profiles whose connection type is
`802-3-ethernet` or `802-11-wireless` are editable. Other profile types are
shown as unsupported.

### Editable fields

The checked-in `schema.json` is authoritative for the schema-defined field
types and validation; the UI/source also handles the displayed BSSID and IP
address, gateway, and DNS values. The UI currently supports:

* common connection fields: profile name, automatic connection, and optional
  interface-name binding;
* Ethernet: MTU and MAC address;
* Wi-Fi: SSID, infrastructure or access-point mode, hidden-network flag,
  optional BSSID, security of none or WPA personal PSK, and a new PSK;
* IPv4 and IPv6: method, addresses in address/prefix notation, gateway, and
  DNS servers.

An empty MTU, MAC address, interface binding, BSSID, gateway, or DNS value
unsets that value. Entering an address makes the corresponding family use the
manual method; otherwise the selected method is used. The IPv4 methods are
`auto`, `manual`, `disabled`, and `link-local`. IPv6 additionally supports
`ignore`. MTU is limited to 576--65536, SSIDs to 32 bytes, and the usual
address and MAC validation is applied.

Unknown settings returned by `GetSettings()` are retained and sent back when
an existing profile is updated. The editor does not infer or edit fields it
does not expose. In particular, 802.1X and certificates, WireGuard,
bond/bridge/team/VLAN profiles, advanced routes and policy routing, and
unsupported speed/duplex/WoL or assigned-MAC settings are out of scope.

## Secrets

The UI never calls `GetSecrets()`, never fetches or displays an existing
secret, and does not log PSKs. A blank Wi-Fi PSK preserves the daemon-side
secret. An entered PSK replaces it. A PSK must be 8--63 characters (without a
NUL) or exactly 64 hexadecimal characters, so a 64-hex WPA-PSK is accepted.

## Profile operations and safety

These operations are deliberately separate:

* **Create** opens a new, unsaved Ethernet profile draft. **Apply** persists
  it with NetworkManager `AddConnection2` (to disk), or updates an existing
  profile with `Update2`. A successful save does not activate the profile.
* **Delete** calls the profile's NetworkManager `Delete` method after
  confirmation. It removes the saved profile; it is not an activation or
  device-disconnect operation.
* **Activate** calls `ActivateConnection` for the selected device. Before doing
  so it creates a NetworkManager checkpoint with a 30-second rollback window.
  It waits until discovery confirms that the selected profile is active. On
  activation failure, timeout, or failed confirmation it requests
  `CheckpointRollback`; the checkpoint is destroyed only after success or
  rollback. A failure of rollback is reported separately. Activation can
  interrupt the current Cockpit session.
* **Deactivate** calls `DeactivateConnection` for the active connection on
  the selected device. It does not delete or change the saved profile.

Authorization errors, D-Bus errors, stale object paths, NetworkManager
restarts, and timeouts are reported as UI errors. Save success is reported
separately from a failure to refresh the view afterward.

## Development, installation, and removal

From this directory:

```sh
npm ci
npm run build
npm test
npm run check
```

`npm run build` generates both required runtime assets:
`dist/networkmanager-editor.js` and `dist/networkmanager-editor.css`. The
CSS includes the bundled PatternFly CSS and the example's local styles.
Before packaging, verify that `networkmanager-editor.html` references both
assets and that its `nm-asset-revision` revision matches the generated
JavaScript revision:

```sh
test -s dist/networkmanager-editor.js
test -s dist/networkmanager-editor.css
npm run check
```

For a development installation, symlink this directory as the package and
keep the generated assets in place:

```sh
sudo ln -sfn "$PWD" /usr/share/cockpit/networkmanager-editor
```

For a system-wide installation, install the complete deployable package:
`manifest.json`, `networkmanager-editor.html`, and the whole `dist/`
directory. For example, after building:

```sh
sudo install -d /usr/share/cockpit/networkmanager-editor/dist
sudo install -m 0644 manifest.json networkmanager-editor.html \
    /usr/share/cockpit/networkmanager-editor/
sudo install -m 0644 dist/networkmanager-editor.js dist/networkmanager-editor.css \
    /usr/share/cockpit/networkmanager-editor/dist/
```

Verify package discovery before testing the editor:

```sh
test -f /usr/share/cockpit/networkmanager-editor/manifest.json
test -f /usr/share/cockpit/networkmanager-editor/networkmanager-editor.html
```

Then open Cockpit's **Tools** menu and verify that **NetworkManager editor
(PoC)** is listed. If it is missing, check the package directory, manifest,
and browser/Cockpit reload before investigating NetworkManager.

Do not install `node_modules` as part of the Cockpit package. Replace the HTML
and both generated assets as one revision, then reload Cockpit and the browser;
the page rejects mismatched asset revisions. To remove either installation,
remove the symlink or package directory:

```sh
sudo rm -f /usr/share/cockpit/networkmanager-editor   # symlink install
sudo rm -rf /usr/share/cockpit/networkmanager-editor  # copied install
```

The source tree's unit and contract tests do not provide privileged D-Bus,
NetworkManager mutation, browser, rendered-geometry, or authorization
integration validation. Those checks have not been performed here and require
a disposable host with a running Cockpit session, compatible NetworkManager,
and administrator authorization.

For API details, see the [NetworkManager D-Bus API](https://networkmanager.dev/docs/api/latest/)
and the [Cockpit packages guide](https://docs.cockpit-project.org/cockpit-guide/latest/guide/packages.html).
