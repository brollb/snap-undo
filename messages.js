/*globals DialogBoxMorph, Point, HandleMorph, BlockEditorMorph, SpriteMorph,
  ReporterBlockMorph, modules*/
// Global settings /////////////////////////////////////////////////////

modules.messages = '2015-October-02';

// Message /////////////////////////////////////////////////////////////
/*
   This is a Message object for NetsBlox. It contains a number of
   predefined fields
 */

function MessageType(name, fields) {
    this.name = name;
    this.fields = fields;
}

function Message(type) {
    this.type = type;
    this.contents = {};
    this.init();
}

Message.prototype.init = function() {
    for (var i = this.type.fields.length; i--;) {
        this.set(this.type.fields[i], 0);
    }
};

Message.prototype.set = function(field, value) {
    this.contents[field] = value;
};

Message.prototype.get = function(field) {
    return this.contents[field];
};

Message.prototype.getFieldNames = function() {
    return this.type.fields.slice();
};

Message.prototype.toString = function() {
    // FIXME: Better representation would be good...
    // Can I reuse the List graphic?
    return this.type.name + ' Message';
};

// MessageFrame
function MessageFrame() {
    this.msgTypes = {};
    this.version = Date.now();
}

MessageFrame.prototype.addMsgType = function(messageType) {
    this.msgTypes[messageType.name] = messageType;
    this.version = Date.now();
};

MessageFrame.prototype.getMsgType = function(name) {
    return this.msgTypes[name];
};

MessageFrame.prototype.deleteMsgType = function(name) {
    delete this.msgTypes[name];
    this.version = Date.now();
};

MessageFrame.prototype.names = function() {
    return Object.keys(this.msgTypes);
};

// MessageCreatorMorph ///////////////////////////////////////////

// A MessageCreatorMorph is used to create custom message types.

MessageCreatorMorph.prototype = new DialogBoxMorph();
MessageCreatorMorph.prototype.constructor = MessageCreatorMorph;
MessageCreatorMorph.uber = DialogBoxMorph.prototype;



function MessageCreatorMorph(target, action) {
    this.minWidth = 0;
    this.init(target, action);
    MessageCreatorMorph.prototype._fixLayout = DialogBoxMorph.prototype.fixLayout;
    MessageCreatorMorph.prototype.fixLayout = function() {
        var th = fontHeight(this.titleFontSize) + this.titlePadding * 2, w;

        if (this.head) {
            this.head.setPosition(this.position().add(new Point(
                this.padding,
                th + this.padding
            )));
            this.silentSetWidth(this.head.width() + this.padding * 2);
            this.silentSetHeight(
                this.head.height()
                + this.padding * 2
                + th
            );
        }

        if (this.body) {
            if (this.head) {
                this.body.setPosition(this.head.bottomLeft().add(new Point(
                    0,
                    this.padding
                )));
                this.silentSetWidth(Math.max(
                    this.width(),
                    this.body.width() + this.padding * 2
                ));
                this.silentSetHeight(
                    this.height()
                    + this.body.height()
                    + this.padding
                );
                w = this.width();
                this.head.setLeft(
                    this.left()
                    + Math.round((w - this.head.width()) / 2)
                );
                this.body.setLeft(
                    this.left()
                    + Math.round((w - this.body.width()) / 2)
                );
            } else {
                this.body.setPosition(this.position().add(new Point(
                    this.padding,
                    th + this.padding
                )));
                this.minWidth = this.minWidth || 0;
                var originalWidth = this.body.width() + this.padding * 2;
                // this.silentSetWidth(originalWidth);
                this.silentSetWidth(Math.max(originalWidth, this.minWidth));
                this.silentSetHeight(
                    this.body.height()
                    + this.padding * 2
                    + th
                );
                this.body.setLeft(this.left() + Math.round((this.width() - this.body.width()) / 2));
            }
        }

        if (this.label) {
            this.label.setCenter(this.center());
            this.label.setTop(this.top() + (th - this.label.height()) / 2);
        }

        if (this.buttons && (this.buttons.children.length > 0)) {
            this.buttons.fixLayout();
            this.silentSetHeight(
                this.height()
                + this.buttons.height()
                + this.padding
            );
            this.silentSetWidth(Math.max(
                this.width(),
                this.buttons.width()
                + (2 * this.padding)
            )
            );
            this.buttons.setCenter(this.center());
            this.buttons.setBottom(this.bottom() - this.padding);
        }
    };
}

MessageCreatorMorph.prototype.init = function(target, action) {
    var myself = this;

    MessageCreatorMorph.uber.init.call(this, target);

    this.key = 'createNewMsgType';
    this.labelString = 'Create Message Type';
    this.createLabel();

    // Create message definition area
    var messageBlock = new MessageDefinitionBlock();

    this.addBody(messageBlock);
    var fixLayout = messageBlock.fixLayout;
    messageBlock.fixLayout = function() {
        this.parent.drawNew();
        fixLayout.call(this);
        myself.fixLayout();
        myself.handle.drawNew();  // Should this be automatic?
        myself.drawNew();
    };

    this.accept = function() {
        // Get the info for the message type
        var desc = {
            name: messageBlock.messageName(),
            fields: messageBlock.fields()
        };

        if (desc.name) {
            action(desc);
        }
        this.destroy();
    };

    this.addButton('ok', 'OK');
    this.addButton('cancel', 'Cancel');
    this.fixLayout();
    this.drawNew();
    this.minWidth = this.width();
};

MessageCreatorMorph.prototype.popUp = function () {
    var world = this.target.world();

    if (world) {
        BlockEditorMorph.uber.popUp.call(this, world);
        this.handle = new HandleMorph(
            this,
            280,
            220,
            this.corner,
            this.corner
        );
    }
};

MessageDefinitionBlock.prototype = new ReporterBlockMorph();
MessageDefinitionBlock.prototype.constructor = MessageDefinitionBlock;
MessageDefinitionBlock.uber = ReporterBlockMorph.prototype;

function MessageDefinitionBlock() {
    this.init();
}

MessageDefinitionBlock.prototype.init = function() {
    MessageDefinitionBlock.uber.init.call(this);

    this.color = SpriteMorph.prototype.blockColor.network;
    this.category = 'network';
    this.setSpec('name: %hintname fields: %mhintfield');
    this.drawNew();
};

MessageDefinitionBlock.prototype.messageName = function() {
    return this.inputs()[0].evaluate();
};

MessageDefinitionBlock.prototype.fields = function() {
    return this.inputs()[1].evaluate();
};
