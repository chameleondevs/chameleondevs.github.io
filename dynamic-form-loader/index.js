import { Button } from "./Components/Atoms/Button/Button.js";
import { CopyToClipboard } from "./Components/Molecules/CopyToClipboard/CopyToClipboard.js";
import { Card } from "./Components/Atoms/Card/Card.js";
import { StatusLight } from "./Components/Atoms/StatusLight/StatusLight.js";
import { Label } from "./Components/Atoms/Label/Label.js";
import { Input } from "./Components/Atoms/Input/Input.js";
import { DropdownContainer } from "./Components/Atoms/Dropdown/Dropdown.js";
import { DropdownItem } from "./Components/Atoms/DropdownItem/DropdownItem.js";
import { LogScreen } from "./Components/Atoms/LogScreen/LogScreen.js";
import { Toggle } from "./Components/Atoms/Toggle/Toggle.js";
import { Select } from "./Components/Atoms/Select/Select.js";
import { Tag } from "./Components/Atoms/Tag/Tag.js";

customElements.define('zui-button', Button);
customElements.define('zui-copy-to-clipboard', CopyToClipboard);
customElements.define('zui-card', Card);
customElements.define('zui-status-light', StatusLight);
customElements.define('zui-label', Label)
customElements.define('zui-input', Input)
customElements.define('zui-dropdown', DropdownContainer);
customElements.define('zui-dropdown-item', DropdownItem);
customElements.define('zui-log-screen', LogScreen);
customElements.define('zui-toggle', Toggle);
customElements.define('zui-select', Select);
customElements.define('zui-tag', Tag);

const toggleButton = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');

toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('visible');
});
