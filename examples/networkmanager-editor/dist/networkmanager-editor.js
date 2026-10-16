"use strict";
(() => {
  // ../../../pkg/lib/cockpit-dark-theme.ts
  function debug(...args) {
    if (window.debugging == "all" || window.debugging?.includes("style")) {
      console.debug([`cockpit-dark-theme: ${document.documentElement.id}:`, ...args].join(" "));
    }
  }
  function changeDarkThemeClass(documentElement, dark_mode) {
    debug(`Setting cockpit theme to ${dark_mode ? "dark" : "light"}`);
    if (dark_mode) {
      documentElement.classList.add("pf-v6-theme-dark");
    } else {
      documentElement.classList.remove("pf-v6-theme-dark");
    }
  }
  function _setDarkMode(_style) {
    const style = _style || localStorage.getItem("shell:style") || "auto";
    let dark_mode;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches && style === "auto" || style === "dark") {
      dark_mode = true;
    } else {
      dark_mode = false;
    }
    changeDarkThemeClass(document.documentElement, dark_mode);
  }
  window.addEventListener("storage", (event) => {
    if (event.key === "shell:style") {
      debug(`Storage element 'shell:style' changed from  ${event.oldValue} to ${event.newValue}`);
      _setDarkMode();
    }
  });
  window.addEventListener("cockpit-style", (event) => {
    if (event instanceof CustomEvent) {
      const style = event.detail.style;
      debug(`Event received from shell with 'cockpit-style'  ${style}`);
      _setDarkMode(style);
    }
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    debug(`Operating system theme preference changed to ${window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"}`);
    _setDarkMode();
  });
  _setDarkMode();

  // schema.json
  var schema_default = {
    version: 1,
    scope: "PoC: common Ethernet and Wi-Fi profiles only; unsupported settings are preserved but not inferred or edited.",
    fields: {
      "connection.id": { type: "string", required: true, help: "A local profile name." },
      "connection.autoconnect": { type: "boolean", help: "Whether NetworkManager may activate this profile automatically." },
      "connection.interface-name": { type: "string", unset: "delete" },
      "802-3-ethernet.mtu": { type: "uint32", min: 576, max: 65536, unset: "delete" },
      "802-3-ethernet.mac-address": { type: "byte-array", format: "mac", unset: "delete" },
      "802-11-wireless.ssid": { type: "byte-array", maxBytes: 32 },
      "802-11-wireless.mode": { type: "string", allowed: ["infrastructure", "ap"] },
      "802-11-wireless.hidden": { type: "boolean" },
      "802-11-wireless-security.psk": { type: "secret", blank: "preserve", fetch: false },
      "ipv4.method": { type: "string", allowed: ["auto", "manual", "disabled", "link-local"] },
      "ipv6.method": { type: "string", allowed: ["auto", "manual", "disabled", "link-local", "ignore"] }
    },
    disabled: ["802.1X/certificates", "wireguard", "bond/bridge/team/vlan", "advanced routes and policy routing", "speed/duplex/WoL writes when absent from the loaded profile"]
  };

  // src/variants.js
  function unwrap(value) {
    if (value && typeof value === "object" && typeof value.t === "string" && Object.hasOwn(value, "v")) return unwrap(value.v);
    if (Array.isArray(value)) return value.map(unwrap);
    if (value && typeof value === "object" && !(value instanceof Uint8Array)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unwrap(item)]));
    return value;
  }
  function variant(signature, value) {
    return globalThis.cockpit?.variant ? cockpit.variant(signature, value) : { t: signature, v: value };
  }
  function infer(value) {
    if (typeof value === "boolean") return variant("b", value);
    if (typeof value === "number") return variant(Number.isInteger(value) ? "i" : "d", value);
    if (typeof value === "string") return variant("s", value);
    if (value instanceof Uint8Array) return variant("ay", value);
    if (Array.isArray(value)) return variant("as", value);
    if (value && typeof value === "object") return variant("a{sv}", Object.fromEntries(Object.entries(value).map(([key, item]) => [key, infer(item)])));
    return variant("s", "");
  }
  function cloneSettings(settings) {
    return structuredClone(settings);
  }
  function preserveSecret(existing, section, key, entered) {
    const current = existing?.[section]?.[key];
    if (entered === void 0 || entered === "") return current;
    return variant("s", entered);
  }
  function setOrDelete(section, key, value) {
    if (value === void 0 || value === null || value === "") delete section[key];
    else section[key] = infer(value);
  }

  // src/validators.js
  var ipv4 = (value) => /^(?:\d{1,3}\.){3}\d{1,3}$/.test(value) && value.split(".").every((part) => Number(part) <= 255);
  var ipv6 = (value) => /^[0-9a-f:]+$/i.test(value) && value.includes(":") && value.length <= 39;
  var prefix = (value) => /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 128;
  var address = (value) => {
    const [host, bits] = value.split("/");
    return Boolean(bits && (ipv4(host) && Number(bits) <= 32 || ipv6(host) && prefix(bits)));
  };
  var mtu = (value) => value === "" || /^\d+$/.test(value) && Number(value) >= 576 && Number(value) <= 65536;
  var mac = (value) => value === "" || /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(value);
  var ssid = (value) => new TextEncoder().encode(value).length <= 32 && !/[\u0000]/.test(value);
  var psk = (value) => value === "" || (value.length >= 8 && value.length <= 63 && !/[\u0000]/.test(value) || /^[0-9a-f]{64}$/i.test(value));
  var _ = globalThis.cockpit?.gettext || ((value) => value);
  function validate(values) {
    const errors = {};
    if (!values.id.trim() || values.id.length > 255) errors.id = _("Enter a connection name (up to 255 characters).");
    if (!mtu(values.mtu)) errors.mtu = _("MTU must be between 576 and 65536.");
    if (!mac(values.mac)) errors.mac = _("Enter a MAC address in hexadecimal form.");
    if (values.ssid !== void 0 && !ssid(values.ssid)) errors.ssid = _("SSID must be at most 32 bytes and contain no NUL.");
    if (!psk(values.psk)) errors.psk = _("A PSK must be 8\u201363 characters or a 64-character hexadecimal key.");
    for (const family of ["ipv4", "ipv6"]) {
      const valuesForFamily = values[family] || [];
      if (valuesForFamily.some((item) => !address(item))) errors[family] = _("Use address/prefix notation with a valid address.");
    }
    return errors;
  }

  // src/dbus-contracts.js
  var NM = "org.freedesktop.NetworkManager";
  var NM_PATH = "/org/freedesktop/NetworkManager";
  var PROP = "org.freedesktop.DBus.Properties";
  var SETTINGS = "org.freedesktop.NetworkManager.Settings";
  var CONNECTION = "org.freedesktop.NetworkManager.Settings.Connection";
  var DEVICE = "org.freedesktop.NetworkManager.Device";
  var INPUT_SIGNATURES = Object.freeze({
    Get: "ss",
    CheckpointCreate: "aouu",
    CheckpointRollback: "o",
    CheckpointDestroy: "o",
    ActivateConnection: "ooo",
    DeactivateConnection: "o",
    Update2: "a{sa{sv}}ua{sv}",
    AddConnection2: "a{sa{sv}}ua{sv}"
  });
  function inputSignature(method) {
    return INPUT_SIGNATURES[method];
  }
  function dbusCall(client2, path, iface, method, args = [], timeout = 15e3) {
    const type = inputSignature(method);
    return client2.call(path, iface, method, args, type === void 0 ? { timeout } : { type, timeout });
  }

  // src/checkpoint.js
  var _2 = globalThis.cockpit?.gettext || ((value) => value);
  var waitFor = (promise, timeout) => {
    let timer;
    const expiry = new Promise((_5, reject) => {
      timer = setTimeout(() => reject(new Error(_5("NetworkManager checkpoint timed out."))), timeout);
    });
    return Promise.race([promise, expiry]).finally(() => clearTimeout(timer));
  };
  async function withCheckpoint(client2, managerPath, operation, { timeout = 3e4, devices = [], confirm = async () => true } = {}) {
    const call2 = (method, args) => client2.call(managerPath, NM, method, args, { type: inputSignature(method), timeout });
    const [checkpoint] = await waitFor(call2("CheckpointCreate", [devices, Math.ceil(timeout / 1e3), 0]), timeout);
    let confirmed = false, rolledBack = false;
    try {
      await waitFor(operation(), timeout);
      try {
        confirmed = await waitFor(confirm(), timeout);
      } catch (error) {
        error.confirmationTimeout = true;
      }
      if (!confirmed) {
        const error = new Error(_2("NetworkManager did not confirm activation before the checkpoint timed out."));
        try {
          await call2("CheckpointRollback", [checkpoint]);
          rolledBack = true;
        } catch (rollbackError) {
          error.rollbackError = rollbackError;
        }
        throw error;
      }
    } catch (error) {
      if (confirmed) throw error;
      if (!rolledBack && !error.rollbackError) {
        try {
          await call2("CheckpointRollback", [checkpoint]);
          rolledBack = true;
        } catch (rollbackError) {
          error.rollbackError = rollbackError;
        }
      }
      throw error;
    } finally {
      await call2("CheckpointDestroy", [checkpoint]).catch(() => {
      });
    }
    return checkpoint;
  }

  // src/discovery.js
  var EDITABLE_TYPES = /* @__PURE__ */ new Set(["802-3-ethernet", "802-11-wireless"]);
  var ACTIVE_CONNECTION = "org.freedesktop.NetworkManager.ActiveConnection";
  async function property(call2, path, iface, name) {
    const [value] = await call2(path, PROP, "Get", [iface, name]);
    return value;
  }
  async function deviceInfo(call2, path) {
    const [deviceType, activeConnection, iface] = await Promise.all([
      property(call2, path, DEVICE, "DeviceType"),
      property(call2, path, DEVICE, "ActiveConnection"),
      property(call2, path, DEVICE, "Interface")
    ]);
    let accessPoints = [];
    if (unwrap(deviceType) === 2) {
      try {
        accessPoints = unwrap(await property(call2, path, "org.freedesktop.NetworkManager.Device.Wireless", "AccessPoints")) || [];
      } catch (error) {
      }
    }
    return { path, properties: { DeviceType: deviceType, ActiveConnection: activeConnection, Interface: iface }, accessPoints };
  }
  async function discoverNetwork(call2) {
    const [[devicePaths], [profilePaths]] = await Promise.all([
      call2(NM_PATH, NM, "GetAllDevices"),
      call2("/org/freedesktop/NetworkManager/Settings", SETTINGS, "ListConnections")
    ]);
    const devices = await Promise.all((devicePaths || []).map((path) => deviceInfo(call2, path)));
    const accessPointPaths = [...new Set(devices.flatMap((device) => device.accessPoints.map((path) => unwrap(path))))];
    const aps = await Promise.all(accessPointPaths.map(async (path) => {
      const [ssid2, strength, flags] = await Promise.all([
        property(call2, path, "org.freedesktop.NetworkManager.AccessPoint", "Ssid"),
        property(call2, path, "org.freedesktop.NetworkManager.AccessPoint", "Strength"),
        property(call2, path, "org.freedesktop.NetworkManager.AccessPoint", "Flags")
      ]);
      return { path, properties: { Ssid: unwrap(ssid2), Strength: unwrap(strength), Flags: unwrap(flags) } };
    }));
    const profiles = await Promise.all((profilePaths || []).map(async (path) => {
      try {
        const [settings] = await call2(path, CONNECTION, "GetSettings");
        const type = unwrap(settings?.connection?.type);
        return { path, settings, type, editable: EDITABLE_TYPES.has(type) };
      } catch (classificationError) {
        return { path, editable: false, classificationError };
      }
    }));
    const activePaths = [...new Set(devices.map((device) => unwrap(device.properties.ActiveConnection)).filter((path) => path && path !== "/"))];
    const activeConnections = /* @__PURE__ */ new Map();
    await Promise.all(activePaths.map(async (path) => {
      const connection = await property(call2, path, ACTIVE_CONNECTION, "Connection");
      activeConnections.set(path, unwrap(connection));
    }));
    return { devices, profiles, activeConnections, aps };
  }
  function activeConnectionPath(device, activeConnections) {
    const active = unwrap(device.properties.ActiveConnection);
    return active && active !== "/" ? active : null;
  }
  function activeProfilePath(device, activeConnections) {
    const active = activeConnectionPath(device, activeConnections);
    return active ? activeConnections.get(active) || null : null;
  }
  function deviceTypeIsSupported(device) {
    const type = unwrap(device.properties.DeviceType);
    return [1, 2, "ethernet", "wifi"].includes(type);
  }

  // src/settings.js
  var _3 = globalThis.cockpit?.gettext || ((value) => value);
  function bytes(value) {
    if (value instanceof Uint8Array) return value;
    if (Array.isArray(value)) return new Uint8Array(value);
    return new Uint8Array();
  }
  function ipv4ToUint32(address2) {
    return address2.split(".").reduce((value, octet) => value * 256 + Number(octet), 0) >>> 0;
  }
  function uint32ToIpv4(value) {
    const number = Number(value) >>> 0;
    return [number >>> 24, number >>> 16 & 255, number >>> 8 & 255, number & 255].join(".");
  }
  function ipv6ToBytes(address2) {
    const halves = address2.split("::");
    const left = halves[0] ? halves[0].split(":") : [];
    const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
    const groups = halves.length === 2 ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right] : address2.split(":");
    if (groups.length !== 8) throw new Error(_3("Invalid IPv6 address"));
    const output = new Uint8Array(16);
    groups.forEach((group, index) => {
      const number = parseInt(group || "0", 16);
      output[index * 2] = number >> 8;
      output[index * 2 + 1] = number & 255;
    });
    return output;
  }
  function bytesToIpv6(value) {
    const octets = bytes(value);
    if (octets.length !== 16) return "";
    const groups = [];
    for (let index = 0; index < 16; index += 2) groups.push((octets[index] << 8 | octets[index + 1]).toString(16));
    let bestStart = -1, bestLength = 0;
    for (let start = 0; start < 8; ) {
      if (groups[start] !== "0") {
        start++;
        continue;
      }
      let end = start;
      while (end < 8 && groups[end] === "0") end++;
      if (end - start > bestLength) {
        bestStart = start;
        bestLength = end - start;
      }
      start = end;
    }
    if (bestLength < 2) return groups.join(":");
    return `${groups.slice(0, bestStart).join(":")}::${groups.slice(bestStart + bestLength).join(":")}`;
  }
  function ipv4AddressesFromSettings(section = {}) {
    return (unwrap(section.addresses) || []).map((address2) => Array.isArray(address2) ? `${uint32ToIpv4(address2[0])}/${address2[1]}` : address2);
  }
  function ipv6AddressesFromSettings(section = {}) {
    const modern = unwrap(section["address-data"]);
    if (Array.isArray(modern)) return modern.map((item) => `${item.address || item.Address}/${item.prefix || item.Prefix}`);
    return (unwrap(section.addresses) || []).map((address2) => `${bytesToIpv6(address2[0])}/${address2[1]}`);
  }
  function dnsFromSettings(family, section = {}) {
    const value = unwrap(section.dns) || [];
    return family === "ipv6" ? value.map(bytesToIpv6) : value.map(uint32ToIpv4);
  }
  function addressData(addresses) {
    return variant("aa{sv}", addresses.map((value) => {
      const [address2, prefix2] = value.split("/");
      return { address: variant("s", address2), prefix: variant("u", Number(prefix2)) };
    }));
  }
  function ipv4LegacyAddresses(addresses) {
    return variant("aau", addresses.map((value) => {
      const [address2, prefix2] = value.split("/");
      return [ipv4ToUint32(address2), Number(prefix2), 0];
    }));
  }
  function dnsValues(family, values) {
    return variant(family === "ipv6" ? "aay" : "au", values.map((value) => family === "ipv6" ? ipv6ToBytes(value) : ipv4ToUint32(value)));
  }
  function readGateway(section = {}) {
    return unwrap(section.gateway) || "";
  }

  // src/save-flow.js
  async function saveThenRefresh(save, refresh) {
    await save();
    try {
      await refresh();
      return { saved: true, refreshError: null };
    } catch (refreshError) {
      return { saved: true, refreshError };
    }
  }

  // src/app.js
  var _4 = cockpit.gettext;
  var ASSET_REVISION = "nm-editor-2";
  var $ = (id) => document.getElementById(id);
  var state = { clients: [], subscriptions: [], timers: [], destroyed: false, dbus: null, profiles: [], devices: [], activeConnections: /* @__PURE__ */ new Map(), aps: [], selected: null, settings: null, original: null, dirty: false, capabilities: {}, schema: schema_default };
  var errorText = (error) => error?.message || error?.problem || String(error);
  var status = (message, error = false) => {
    const node = $("global-status");
    node.textContent = message;
    node.classList.toggle("error", error);
  };
  var saveStatus = (message, error = false) => {
    $("save-status").textContent = message;
    $("save-status").classList.toggle("error", error);
  };
  function client() {
    if (!state.dbus) {
      state.dbus = cockpit.dbus(NM, { superuser: "require", track: true });
      state.clients.push(state.dbus);
    }
    return state.dbus;
  }
  function call(path, iface, method, args = [], timeout = 15e3) {
    return dbusCall(client(), path, iface, method, args, timeout);
  }
  function markDirty() {
    state.dirty = true;
    $("apply").disabled = false;
    $("discard").disabled = false;
  }
  function textValue(id, value) {
    $(id).value = value ?? "";
  }
  function bytesToText(value) {
    if (value instanceof Uint8Array) return new TextDecoder().decode(value);
    if (Array.isArray(value)) return new TextDecoder().decode(new Uint8Array(value));
    return value || "";
  }
  function textToBytes(value) {
    return new Uint8Array(new TextEncoder().encode(value));
  }
  async function discover() {
    status(_4("Discovering NetworkManager\u2026"));
    const discovered = await discoverNetwork(call);
    state.devices = discovered.devices;
    state.activeConnections = discovered.activeConnections;
    state.profiles = discovered.profiles;
    state.aps = discovered.aps;
    const profileSelect = $("profile-select");
    profileSelect.replaceChildren(new Option(_4("Select a saved profile"), ""));
    state.profiles.forEach((profile) => {
      const option = new Option(unwrap(profile.settings.Id || profile.settings.id) || profile.path.split("/").pop(), profile.path);
      option.disabled = !profile.editable;
      if (!profile.editable) option.textContent += _4(" (unsupported profile type)");
      profileSelect.add(option);
    });
    const deviceSelect = $("device-select");
    deviceSelect.replaceChildren(new Option(_4("No device binding"), ""));
    state.devices.filter(deviceTypeIsSupported).forEach((device) => {
      const props = Object.fromEntries(Object.entries(device.properties).map(([key, val]) => [key, unwrap(val)]));
      deviceSelect.add(new Option(props.Interface || device.path, device.path));
    });
    const list = $("access-points");
    list.replaceChildren();
    if (!state.aps.length) list.append(Object.assign(document.createElement("li"), { textContent: _4("No access points were reported by NetworkManager.") }));
    else state.aps.forEach((ap) => {
      const item = document.createElement("li"), props = ap.properties;
      item.textContent = `${bytesToText(props.Ssid)} \u2014 ${props.Strength ?? "?"}%${props.Flags ? ` (${props.Flags})` : ""}`;
      list.append(item);
    });
    const [version] = await call(NM_PATH, PROP, "Get", [NM, "Version"]);
    state.capabilities.version = unwrap(version);
    status(state.profiles.some((profile) => profile.editable) ? _4("NetworkManager is available. Select a profile or create one.") : _4("NetworkManager is available, but no editable profiles were found."));
  }
  async function loadProfile(path) {
    if (!path) {
      $("editor").hidden = true;
      return;
    }
    const profile = state.profiles.find((item) => item.path === path);
    if (!profile?.editable) {
      status(_4("This profile type is not supported by the editor."), true);
      $("profile-select").value = "";
      return;
    }
    try {
      const [settings] = await call(path, CONNECTION, "GetSettings");
      state.settings = settings;
      state.original = cloneSettings(settings);
      state.selected = path;
      renderSettings();
      $("editor").hidden = false;
      $("delete-profile").disabled = false;
      updateActivationButtons();
      saveStatus(_4("Profile loaded. Existing secrets were not fetched."));
    } catch (error) {
      status(_4("Could not load the profile: {error}").replace("{error}", errorText(error)), true);
    }
  }
  function renderSettings() {
    const c = state.settings?.connection || {}, ethernet = state.settings?.["802-3-ethernet"] || {}, wifi = state.settings?.["802-11-wireless"] || {}, v4 = state.settings?.ipv4 || {}, v6 = state.settings?.ipv6 || {};
    textValue("id-field", unwrap(c.id));
    $("type-field").value = unwrap(c.type) || "802-3-ethernet";
    $("autoconnect-field").checked = Boolean(unwrap(c.autoconnect));
    textValue("interface-field", unwrap(c["interface-name"]));
    textValue("mtu-field", unwrap(ethernet.mtu ?? wifi.mtu));
    textValue("mac-field", bytesToText(unwrap(ethernet["mac-address"] ?? wifi["mac-address"])));
    textValue("ssid-field", bytesToText(unwrap(wifi.ssid)));
    $("wifi-mode-field").value = unwrap(wifi.mode) || "infrastructure";
    $("hidden-field").checked = Boolean(unwrap(wifi.hidden));
    textValue("bssid-field", bytesToText(unwrap(wifi.bssid)));
    $("security-field").value = state.settings["802-11-wireless-security"] ? "wpa-psk" : "none";
    textValue("psk-field", "");
    $("ipv4-method").value = unwrap(v4.method) || "auto";
    textValue("ipv4-addresses", ipv4AddressesFromSettings(v4).join("\n"));
    textValue("ipv4-gateway", readGateway(v4));
    textValue("ipv4-dns", dnsFromSettings("ipv4", v4).join("\n"));
    $("ipv6-method").value = unwrap(v6.method) || "auto";
    textValue("ipv6-addresses", ipv6AddressesFromSettings(v6).join("\n"));
    textValue("ipv6-gateway", readGateway(v6));
    textValue("ipv6-dns", dnsFromSettings("ipv6", v6).join("\n"));
    $("apply").disabled = true;
    $("discard").disabled = true;
    state.dirty = false;
  }
  function formValues() {
    return { id: $("id-field").value.trim(), type: $("type-field").value, autoconnect: $("autoconnect-field").checked, iface: $("interface-field").value.trim(), mtu: $("mtu-field").value.trim(), mac: $("mac-field").value.trim(), ssid: $("ssid-field").value, mode: $("wifi-mode-field").value, hidden: $("hidden-field").checked, bssid: $("bssid-field").value.trim(), security: $("security-field").value, psk: $("psk-field").value, ipv4: $("ipv4-addresses").value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean), ipv6: $("ipv6-addresses").value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean) };
  }
  function setSection(settings, section) {
    if (!settings[section]) settings[section] = {};
    return settings[section];
  }
  function applyValues(values) {
    const settings = cloneSettings(state.settings), c = setSection(settings, "connection");
    c.id = infer(values.id);
    c.type = infer(values.type);
    c.autoconnect = infer(values.autoconnect);
    setOrDelete(c, "interface-name", values.iface);
    const linkName = values.type === "802-11-wireless" ? "802-11-wireless" : "802-3-ethernet", link = setSection(settings, linkName);
    if (values.mtu === "") delete link.mtu;
    else link.mtu = variant("u", Number(values.mtu));
    setOrDelete(link, "mac-address", values.mac ? textToBytes(values.mac) : void 0);
    if (values.type === "802-11-wireless") {
      link.ssid = variant("ay", textToBytes(values.ssid));
      link.mode = infer(values.mode);
      link.hidden = infer(values.hidden);
      setOrDelete(link, "bssid", values.bssid ? textToBytes(values.bssid) : void 0);
      const security = setSection(settings, "802-11-wireless-security");
      security["key-mgmt"] = infer(values.security === "wpa-psk" ? "wpa-psk" : "none");
      const secret = preserveSecret(state.settings, "802-11-wireless-security", "psk", values.psk);
      if (secret !== void 0) security.psk = secret;
    }
    for (const [name, method, addresses, gateway, dns] of [["ipv4", values.ipv4.length ? "manual" : $("ipv4-method").value, values.ipv4, $("ipv4-gateway").value.trim(), $("ipv4-dns").value], ["ipv6", values.ipv6.length ? "manual" : $("ipv6-method").value, values.ipv6, $("ipv6-gateway").value.trim(), $("ipv6-dns").value]]) {
      const section = setSection(settings, name);
      section.method = infer(method);
      if (name === "ipv4" && addresses.length) section.addresses = ipv4LegacyAddresses(addresses);
      else if (name === "ipv6" && addresses.length) section["address-data"] = addressData(addresses);
      else {
        delete section.addresses;
        delete section["address-data"];
      }
      setOrDelete(section, "gateway", gateway);
      const dnsValuesInput = dns.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
      if (dnsValuesInput.length) section.dns = dnsValues(name, dnsValuesInput);
      else delete section.dns;
    }
    return settings;
  }
  async function apply(event) {
    event.preventDefault();
    const values = formValues(), errors = validate(values);
    ["id", "mtu", "mac", "ssid", "psk", "ipv4", "ipv6"].forEach((key) => {
      const node = $(`${key}-error`);
      if (node) node.textContent = errors[key] || "";
    });
    const first = Object.keys(errors)[0];
    if (first) {
      $(`${first}-field`)?.focus();
      return;
    }
    const settings = applyValues(values);
    saveStatus(_4("Saving profile\u2026"));
    $("apply").disabled = true;
    try {
      const result = await saveThenRefresh(async () => {
        if (state.selected) await call(state.selected, CONNECTION, "Update2", [settings, 0, {}]);
        else {
          const [path] = await call("/org/freedesktop/NetworkManager/Settings", SETTINGS, "AddConnection2", [settings, 1, {}]);
          state.selected = path;
        }
        state.settings = settings;
        state.original = cloneSettings(settings);
        state.dirty = false;
        $("discard").disabled = true;
      }, discover);
      if (result.refreshError) {
        saveStatus(_4("Profile saved, but refreshing the view failed: {error}").replace("{error}", errorText(result.refreshError)), true);
      } else {
        saveStatus(_4("Profile saved. Activation is separate."));
        $("profile-select").value = state.selected;
        updateActivationButtons();
      }
    } catch (error) {
      $("apply").disabled = false;
      saveStatus(_4("Profile was not saved: {error}").replace("{error}", errorText(error)), true);
    }
  }
  async function create() {
    state.selected = null;
    state.settings = { connection: { id: infer(_4("New connection")), type: infer("802-3-ethernet"), uuid: infer(crypto.randomUUID()), autoconnect: infer(false) } };
    state.original = cloneSettings(state.settings);
    renderSettings();
    $("editor").hidden = false;
    $("delete-profile").disabled = true;
    markDirty();
  }
  async function removeProfile() {
    if (!state.selected || !window.confirm(_4("Delete this saved profile?"))) return;
    try {
      await call(state.selected, CONNECTION, "Delete");
      saveStatus(_4("Profile deleted."));
      state.selected = null;
      $("editor").hidden = true;
      await discover();
    } catch (error) {
      saveStatus(_4("Profile was not deleted: {error}").replace("{error}", errorText(error)), true);
    }
  }
  function updateActivationButtons() {
    const active = state.devices.some((device) => activeProfilePath(device, state.activeConnections) === state.selected);
    $("activate").disabled = !state.selected || active || !state.capabilities.checkpoint;
    $("deactivate").disabled = !state.selected || !active;
  }
  async function activate() {
    if (!state.selected || !state.capabilities.checkpoint || !window.confirm(_4("Activation can interrupt this Cockpit session. Continue?"))) return;
    saveStatus(_4("Activating with a rollback checkpoint\u2026"));
    const device = $("device-select").value;
    try {
      await withCheckpoint(client(), NM_PATH, () => call(NM_PATH, NM, "ActivateConnection", [state.selected, device || "/", "/"]), { devices: device ? [device] : [], confirm: async () => {
        await discover();
        return state.devices.some((item) => activeProfilePath(item, state.activeConnections) === state.selected);
      } });
      saveStatus(_4("Profile activated; checkpoint destroyed after success."));
    } catch (error) {
      saveStatus(_4("Activation failed; NetworkManager attempted rollback: {error}").replace("{error}", errorText(error)), true);
      if (error.rollbackError) saveStatus(_4("Activation and rollback both failed: {error}").replace("{error}", errorText(error.rollbackError)), true);
    }
  }
  async function deactivate() {
    const device = state.devices.find((item) => item.path === $("device-select").value);
    const active = device && activeConnectionPath(device, state.activeConnections);
    if (!active) return;
    try {
      await call(NM_PATH, NM, "DeactivateConnection", [active]);
      saveStatus(_4("Deactivation requested."));
      await discover();
    } catch (error) {
      saveStatus(_4("Deactivation failed: {error}").replace("{error}", errorText(error)), true);
    }
  }
  function tabs() {
    const buttons = [...document.querySelectorAll("[role=tab]")], activate2 = (button) => {
      buttons.forEach((item) => {
        const selected = item === button;
        item.setAttribute("aria-selected", selected);
        item.parentElement.classList.toggle("pf-m-current", selected);
        $(item.getAttribute("aria-controls")).hidden = !selected;
      });
      button.focus();
    };
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activate2(button));
      button.addEventListener("keydown", (event) => {
        const next = event.key === "ArrowRight" ? (index + 1) % buttons.length : event.key === "ArrowLeft" ? (index + buttons.length - 1) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : -1;
        if (next >= 0) {
          event.preventDefault();
          activate2(buttons[next]);
        }
      });
    });
  }
  function bind() {
    tabs();
    $("profile-select").addEventListener("change", (event) => loadProfile(event.target.value));
    $("new-profile").addEventListener("click", create);
    $("delete-profile").addEventListener("click", removeProfile);
    $("profile-form").addEventListener("submit", apply);
    $("discard").addEventListener("click", () => {
      state.settings = cloneSettings(state.original);
      renderSettings();
      saveStatus(_4("Unsaved changes discarded."));
    });
    $("activate").addEventListener("click", activate);
    $("deactivate").addEventListener("click", deactivate);
    document.querySelectorAll("input,select,textarea").forEach((input) => input.addEventListener("input", markDirty));
  }
  function teardown() {
    state.destroyed = true;
    state.subscriptions.forEach((item) => item.remove());
    state.timers.forEach((item) => clearTimeout(item));
    state.clients.forEach((item) => item.close?.());
  }
  async function init() {
    bind();
    try {
      if (document.querySelector('meta[name="nm-asset-revision"]')?.content !== ASSET_REVISION) {
        const error = new Error(_4("NetworkManager editor assets are from different revisions."));
        error.assetMismatch = true;
        throw error;
      }
      await discover();
      try {
        const [checkpoint] = await call(NM_PATH, NM, "CheckpointCreate", [[], 1, 0], 5e3);
        await call(NM_PATH, NM, "CheckpointDestroy", [checkpoint], 5e3);
        state.capabilities.checkpoint = true;
      } catch (error) {
        state.capabilities.checkpoint = false;
        status(_4("NetworkManager is available, but checkpoint activation is unsupported; Activate is disabled."));
      }
      updateActivationButtons();
    } catch (error) {
      state.capabilities.checkpoint = false;
      status(error.assetMismatch ? error.message : _4("NetworkManager is unavailable or authorization failed: {error}").replace("{error}", errorText(error)), true);
    } finally {
      document.body.hidden = false;
    }
  }
  window.addEventListener("unload", teardown);
  cockpit.transport.wait(() => init());
})();
