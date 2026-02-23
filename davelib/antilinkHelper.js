const { getGroupConfig, setGroupConfig } = require('../Database/settingsStore');

function getAntilinkSetting(groupId) {
    try {
        const config = getGroupConfig(groupId, 'antilink');
        if (!config || !config.enabled) return 'off';
        return config.action || 'delete';
    } catch (error) {
        console.error('Error getting antilink setting:', error.message, 'Line:', error.stack?.split('\n')[1]);
        return 'off';
    }
}

function setAntilinkSetting(groupId, type) {
    try {
        if (type === 'off') {
            setGroupConfig(groupId, 'antilink', { enabled: false, action: 'delete' });
        } else {
            setGroupConfig(groupId, 'antilink', { enabled: true, action: type });
        }
    } catch (error) {
        console.error('Error setting antilink setting:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

function getAntilinkConfig(groupId) {
    try {
        return getGroupConfig(groupId, 'antilink') || { enabled: false, action: 'delete', warnCount: 3 };
    } catch (error) {
        console.error('Error getting antilink config:', error.message, 'Line:', error.stack?.split('\n')[1]);
        return { enabled: false, action: 'delete', warnCount: 3 };
    }
}

function setAntilinkConfig(groupId, config) {
    try {
        setGroupConfig(groupId, 'antilink', config);
    } catch (error) {
        console.error('Error setting antilink config:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = {
    setAntilinkSetting,
    getAntilinkSetting,
    getAntilinkConfig,
    setAntilinkConfig
};
