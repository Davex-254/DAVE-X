function getMessageText(message) {
    if (!message?.message) return '';

    const msg = message.message;

    return msg.conversation?.trim() ||
           msg.extendedTextMessage?.text?.trim() ||
           msg.imageMessage?.caption?.trim() ||
           msg.videoMessage?.caption?.trim() ||
           msg.documentMessage?.caption?.trim() ||
           msg.buttonsResponseMessage?.selectedButtonId?.trim() ||
           msg.listResponseMessage?.singleSelectReply?.selectedRowId?.trim() ||
           msg.templateButtonReplyMessage?.selectedId?.trim() ||
           '';
}

function isEditedMessage(message) {
    if (!message?.message) return false;
    
    const msg = message.message;
    
    // Baileys protocol message for edits (type 14)
    if (msg.protocolMessage?.type === 14) return true;
    if (msg.protocolMessage?.type === 'MESSAGE_EDIT') return true;
    if (msg.editedMessage) return true;
    
    return false;
}

function getEditedMessageText(message) {
    if (!message?.message) return '';

    const msg = message.message;

    if (msg.protocolMessage?.editedMessage?.message) {
        const edited = msg.protocolMessage.editedMessage.message;
        return edited.conversation?.trim() ||
               edited.extendedTextMessage?.text?.trim() ||
               '';
    }

    if (msg.editedMessage?.message) {
        const edited = msg.editedMessage.message;
        return edited.conversation?.trim() ||
               edited.extendedTextMessage?.text?.trim() ||
               '';
    }

    return '';
}

function extractCommand(text, prefix) {
    if (!text || typeof text !== 'string') return { command: '', args: [], fullArgs: '' };
    
    const trimmed = text.trim();
    
    if (prefix && !trimmed.startsWith(prefix)) {
        return { command: '', args: [], fullArgs: '' };
    }

    const withoutPrefix = prefix ? trimmed.slice(prefix.length).trimStart() : trimmed;
    const parts = withoutPrefix.split(/\s+/).filter(p => p.length > 0);
    const command = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);
    const fullArgs = args.join(' ');

    return { command, args, fullArgs };
}

function shouldProcessEditedMessage(message, prefix) {
    if (!isEditedMessage(message)) return false;
    
    const editedText = getEditedMessageText(message);
    if (!editedText) return false;

    if (prefix && !editedText.startsWith(prefix)) return false;

    return true;
}

module.exports = {
    getMessageText,
    isEditedMessage,
    getEditedMessageText,
    extractCommand,
    shouldProcessEditedMessage
};
