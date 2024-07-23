async function fetchJSON(url) {
    const response = await fetch(url);
    return response.json();
}

async function getUserID(accessToken) {
    const response = await fetch('https://discord.com/api/v9/users/@me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return response.json();
}

async function getRoles() {
    const roles = await fetchJSON('https://api.scyted.tv/website/staff-portal/roles.json');
    return roles;
}

async function getUserInfo() {
    const accessToken = document.cookie.split('; ').find(row => row.startsWith('accessToken')).split('=')[1];
    const userData = await getUserID(accessToken);

    const userInfo = await fetchJSON('https://api.scyted.tv/website/staff-portal/user-info.json');
    const rolesData = await getRoles();
    
    const userId = userData.id;
    const userRoles = userInfo[userId] || [];
    
    return { userData, userRoles, rolesData };
}

async function getButtons() {
    const buttons = await fetchJSON('https://api.scyted.tv/website/staff-portal/dashboard-buttons.json');
    return buttons;
}

async function getButtonAccess() {
    const buttonAccess = await fetchJSON('https://api.scyted.tv/website/staff-portal/button-access.json');
    return buttonAccess;
}

function cleanCategoryName(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
}

function getTextColor(hex) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    let luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance > 127.5 ? '#000000' : '#FFFFFF';
}

function displayUserInfo(userData) {
    const userAvatar = document.getElementById('box-user-avatar');
    userAvatar.src = userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 'default-avatar.png';
    document.getElementById('box-user-name').innerText = userData.username;
    document.getElementById('box-user-id').innerText = `ID: ${userData.id}`;
}

function displayRoles(userRoles, rolesData) {
    const rolesList = document.getElementById('roles-list');
    rolesList.innerHTML = ''; 

    const roleMap = new Map();
    const displayedRoleIds = new Set();

    rolesData.forEach(role => {
        roleMap.set(role.roleId, role);
    });

    rolesData.forEach(role => {
        if (role.roleName.startsWith('•')) {
            const categoryName = cleanCategoryName(role.roleName.slice(1).trim());
            const categoryElement = document.createElement('div');
            categoryElement.className = 'role-category';
            categoryElement.innerText = categoryName;
            rolesList.appendChild(categoryElement);
        } else if (userRoles.includes(role.roleId) && !displayedRoleIds.has(role.roleId)) {
            displayedRoleIds.add(role.roleId);

            const roleElement = document.createElement('div');
            roleElement.className = 'role';
            const roleColor = role.roleColor === '#000000' ? '#99AAB5' : role.roleColor;
            roleElement.style.backgroundColor = roleColor;
            roleElement.style.color = getTextColor(roleColor);

            const roleColorElement = document.createElement('div');
            roleColorElement.className = 'role-color';
            roleColorElement.style.backgroundColor = roleColor;

            const roleName = document.createElement('p');
            roleName.className = 'role-name';
            roleName.innerText = role.roleName;

            roleElement.appendChild(roleColorElement);
            roleElement.appendChild(roleName);
            rolesList.appendChild(roleElement);
        }
    });
}

function displayButtons(userRoles, buttonData, buttonAccess) {
    const buttonsList = document.getElementById('buttons-list');
    buttonsList.innerHTML = ''; 

    const accessibleButtons = new Set();

    Object.entries(buttonAccess).forEach(([buttonID, roleIds]) => {
        if (roleIds.some(roleId => userRoles.includes(roleId))) {
            accessibleButtons.add(buttonID);
        }
    });

    buttonData.forEach(button => {
        if (accessibleButtons.has(button.buttonID)) {
            const buttonElement = document.createElement('a');
            buttonElement.href = button.link;
            buttonElement.className = 'button';
            buttonElement.innerText = button.text;
            buttonsList.appendChild(buttonElement);
        }
    });
}

async function init() {
    const { userData, userRoles, rolesData } = await getUserInfo();
    displayUserInfo(userData);
    displayRoles(userRoles, rolesData);

    const buttonData = await getButtons();
    const buttonAccess = await getButtonAccess();
    displayButtons(userRoles, buttonData, buttonAccess);
}

window.onload = init;
