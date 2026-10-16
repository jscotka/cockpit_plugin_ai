export class DomCompatibilityError extends Error {
    constructor(message) { super(message); this.name = "DomCompatibilityError"; }
}

export function renderConfiguration(schema, parsed, { document, translate, edited }) {
    const editable = document.getElementById("editable-grid");
    const readonly = document.getElementById("readonly-grid");
    if (!editable || !readonly)
        throw new DomCompatibilityError(translate("Cockpit configuration assets are incompatible: the editable and read-only grids are required."));
    editable.replaceChildren();
    readonly.replaceChildren();
    const states = {};
    for (const [id, grid] of [["editable-state", editable], ["readonly-state", readonly]]) {
        let node = document.getElementById(id);
        if (!node) {
            node = document.createElement("p"); node.id = id; node.setAttribute("role", "status"); grid.append(node);
        }
        states[id] = node;
    }
    const groups = new Map();
    const inputId = item => `option-${item.section}-${item.key}`.replace(/[^A-Za-z0-9_-]/g, "-");
    for (const item of schema) {
        const target = item.editable ? editable : readonly, group = `${item.editable}:${item.section}`;
        if (!groups.has(group)) {
            const card = document.createElement("section"); card.className = "pf-v6-c-card";
            card.setAttribute("aria-labelledby", `${item.editable ? "editable" : "readonly"}-${item.section}`);
            const header = document.createElement("div"); header.className = "pf-v6-c-card__header";
            const title = document.createElement("h2"); title.className = "pf-v6-c-card__title pf-v6-c-title pf-m-lg";
            title.id = `${item.editable ? "editable" : "readonly"}-${item.section}`; title.textContent = `[${item.section}]`; header.append(title);
            const body = document.createElement("div"); body.className = "pf-v6-c-card__body"; card.append(header, body); target.append(card); groups.set(group, body);
        }
        const field = document.createElement("div"); field.className = "pf-v6-c-form__group";
        const id = inputId(item), option = `${item.section}.${item.key}`;
        const help = document.createElement("p"); help.className = "pf-v6-c-form__helper-text"; help.id = `${id}-help`; help.textContent = translate(item.help);
        if (item.editable) {
            const input = document.createElement("input"); input.className = item.type === "boolean" ? "pf-v6-c-check__input" : "pf-v6-c-form-control"; input.id = id; input.dataset.option = option; input.setAttribute("aria-describedby", help.id); input.type = item.type === "boolean" ? "checkbox" : item.type === "integer" ? "number" : "text";
            if (item.validation?.maxLength) input.maxLength = item.validation.maxLength;
            if (item.type === "integer") { input.min = item.min; input.max = item.max; input.step = "1"; }
            if (item.type !== "boolean") { input.value = parsed.values[option] || ""; input.placeholder = item.placeholder || item.examples?.[0] || ""; } else input.checked = parsed.presence[option] ? parsed.values[option] === "true" : item.default === true;
            input.addEventListener("input", () => edited.add(option)); input.addEventListener("change", () => edited.add(option));
            if (item.type === "boolean") {
                const check = document.createElement("div"); check.className = "pf-v6-c-check";
                const label = document.createElement("label"); label.className = "pf-v6-c-check__label"; label.htmlFor = id; label.textContent = item.key; check.append(input, label); field.append(check, help);
            } else { const label = document.createElement("label"); label.className = "pf-v6-c-form__label"; label.htmlFor = id; label.textContent = item.key; field.append(label, help, input); }
        } else { const value = document.createElement("code"); value.className = "readonly"; value.textContent = parsed.values[option] || translate("not set"); field.append(value); }
        groups.get(group).append(field);
    }
    states["editable-state"].textContent = schema.some(item => item.editable) ? "" : translate("No safely editable options were found.");
    states["readonly-state"].textContent = schema.some(item => !item.editable) ? "" : translate("No read-only options were found.");
}
