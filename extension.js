import Meta from "gi://Meta";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";
import GLib from "gi://GLib";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import Pango from "gi://Pango";
import { convertMD } from "./md2pango.js";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

// Defining necessary variables (Gemini API)
let GEMINI_API_KEY = "";
let GEMINI_MODEL = "";
let HISTORY = [];
let BACKGROUND_COLOR_HUMAN_MESSAGE = "";
let BACKGROUND_COLOR_GEMINI_MESSAGE = "";
let COLOR_HUMAN_MESSAGE = "";
let COLOR_GEMINI_MESSAGE = "";
let TEMPERATURE = 0.7;
let MAX_TOKENS = 1024;

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/";


const GeminiIndicator = GObject.registerClass(
    class GeminiIndicator extends PanelMenu.Button {
        _init(extension, settings, clipboard, openSettings, uuid) {
            super._init(0.0, _('Gemini Menu'));
            this.extension = extension;
            this.settings = settings;
            this.clipboard = clipboard;
            this.openSettings = openSettings;
            this.uuid = uuid;
            this._loadSettings();

            // Create button box
            let buttonBox = new St.BoxLayout({
                style_class: 'panel-status-menu-box'
            });
        
            // Add icon
            let icon = new St.Icon({
                icon_name: 'system-run-symbolic',
                style_class: 'system-status-icon'
            });
            buttonBox.add_child(icon);
            
            // Add to panel button
            this.add_child(buttonBox);
            
            // Initialize components
            this._initMenu();

        }
        _loadSettings() {
            this._settingsChangedId = this.settings.connect(
              "changed",
              this._fetchSettings.bind(this)
            );
            this._fetchSettings();
          }
    
          _fetchSettings() {
                GEMINI_API_KEY = this.settings.get_string("gemini-api-key");
                GEMINI_MODEL = this.settings.get_string("gemini-model");
        
                BACKGROUND_COLOR_HUMAN_MESSAGE = this.settings.get_string(
                  "human-message-color"
                );
                BACKGROUND_COLOR_GEMINI_MESSAGE = this.settings.get_string(
                  "gemini-message-color"
                );
        
                COLOR_HUMAN_MESSAGE = this.settings.get_string("human-message-text-color");
                COLOR_GEMINI_MESSAGE = this.settings.get_string("gemini-message-text-color");
        
                HISTORY = JSON.parse(this.settings.get_string("history"));
        
                TEMPERATURE = this.settings.get_double("temperature");
                MAX_TOKENS = this.settings.get_int("max-tokens");
            }
        

        _initMenu() {
            this.menu = new PopupMenu.PopupMenu(this, 0.0, St.Side.TOP);
              this.menu.actor.add_style_class_name("gemini-popup-menu");
            let menuItem = new PopupMenu.PopupBaseMenuItem({
                reactive: false,
                can_focus: false
            });
        
            let layout = new St.BoxLayout({
                vertical: true,
                style_class: 'popup-menu-box'
            });
    
         // ... INITIALIZATION OF SESSION VARIABLES
         this.history = [];
         this.timeoutCopy = null;
         this.timeoutResponse = null;
     
          // --- EXTENSION FOOTER
              this.chatInput = new St.Entry({
               hint_text: "Chat with me",
               can_focus: true,
               track_hover: true,
               style_class: "messageInput",
             });
     
             // Enter clicked
            this.chatInput.clutter_text.connect("activate", (actor) => {
             if (this.timeoutResponse) {
               GLib.Source.remove(this.timeoutResponse);
               this.timeoutResponse = null;
             }
     
             let input = this.chatInput.get_text();
     
             this.initializeTextBox(
               "humanMessage",
               input,
               BACKGROUND_COLOR_HUMAN_MESSAGE,
               COLOR_HUMAN_MESSAGE
             );
     
             // Add input to chat history
             this.history.push({
               role: "user",
               content: input,
             });
     
             this.geminiChat();
     
             this.chatInput.set_reactive(false);
             this.chatInput.set_text("I am Thinking...");
           });
     
           this.newConversation = new St.Button({
             style:
               "width: 16px; height:16px; margin-right: 15px; margin-left: 10px'",
     
             child: new St.Icon({
               icon_name: "tab-new-symbolic",
               style: "width: 30px; height:30px",
             }),
           });
     
           this.newConversation.connect("clicked", (actor) => {
             if (
               this.chatInput.get_text() ==
                 "Create a new conversation (Deletes current)" ||
               this.chatInput.get_text() != "I am Thinking..."
             ) {
               this.history = [];
     
               const { settings } = this.settings;
               settings.set_string("history", "[]");
     
               this.chatBox.destroy_all_children();
             } else {
               this.initializeTextBox(
                 "geminiMessage",
                 "You can't create a new conversation while I am thinking",
                 BACKGROUND_COLOR_GEMINI_MESSAGE,
                 COLOR_GEMINI_MESSAGE
               );
             }
           });
     
           this.newConversation.connect("enter-event", (actor) => {
             if (this.chatInput.get_text() == "") {
               this.chatInput.set_reactive(false);
               this.chatInput.set_text(
                 "Create a new conversation (Deletes current)"
               );
             }
           });
     
           this.newConversation.connect("leave-event", (actor) => {
             if (
               this.chatInput.get_text() ==
               "Create a new conversation (Deletes current)"
             ) {
               this.chatInput.set_reactive(true);
               this.chatInput.set_text("");
             }
           });
     
           let entryBox = new St.BoxLayout({
             vertical: false,
             style_class: "popup-menu-box",
           });
     
           entryBox.add_child(this.chatInput);
           entryBox.add_child(this.newConversation);
     
           // --- EXTENSION BODY
           this.chatBox = new St.BoxLayout({
             vertical: true,
             style_class: "popup-menu-box",
             style: "text-wrap: wrap",
           });
     
           this.chatInput.set_reactive(false);
           this.chatInput.set_text("Loading history...");
           this._loadHistory();
     
           this.chatView = new St.ScrollView({
             enable_mouse_scrolling: true,
             style_class: "chat-scrolling",
             reactive: true,
           });
     
           this.chatView.set_child(this.chatBox);

            layout.add_child(this.chatView);
            layout.add_child(entryBox)
    
             menuItem.actor.add_child(layout);

            this.menu.addMenuItem(menuItem);
             this.menu.connect('open-state-changed', (menu, isOpen) => {
                if (isOpen) {
                    this.chatInput.grab_key_focus();
                }
            });
        }

      _loadHistory() {
        try {
          this.history = HISTORY;
          this.history.forEach((json) => {
            if (json.role == "user") {
              this.initializeTextBox(
                "humanMessage",
                convertMD(json.content),
                BACKGROUND_COLOR_HUMAN_MESSAGE,
                COLOR_HUMAN_MESSAGE
              );
            } else {
              this.initializeTextBox(
                "geminiMessage",
                convertMD(json.content),
                BACKGROUND_COLOR_GEMINI_MESSAGE,
                COLOR_GEMINI_MESSAGE
              );
            }
          });

          this.chatInput.set_reactive(true);
          this.chatInput.set_text("");
        } catch (e) {
          console.error(`Gemini Extension _loadHistory Error: ${e}`);
        }
        return;
      }

      async geminiChat() {
        try {
          const geminiApiUrl = `${GEMINI_API_URL}${GEMINI_MODEL}:generateContent`;

          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GEMINI_API_KEY}`,
          };

          const body = JSON.stringify({
            contents: [
              {
                parts: [{ text: this.history[this.history.length - 1].content }],
              },
            ],
            generationConfig: {
              temperature: TEMPERATURE,
              maxOutputTokens: MAX_TOKENS,
            },
          });

          let response = await fetch(geminiApiUrl, {
            method: "POST",
            headers: headers,
            body: body,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              `Gemini API Error ${response.status}: ${error.error.message}`
            );
          }

          const result = await response.json();

          const responseText = result.candidates[0].content.parts[0].text;

          let final = convertMD(responseText);
          this.initializeTextBox(
            "geminiMessage",
            final,
            BACKGROUND_COLOR_GEMINI_MESSAGE,
            COLOR_GEMINI_MESSAGE
          );

          // Add input to chat history
          this.history.push({
            role: "assistant",
            content: responseText,
          });

          const { settings } = this.settings;
          settings.set_string("history", JSON.stringify(this.history));

          this.chatInput.set_reactive(true);
          this.chatInput.set_text("");
        } catch (error) {
          let response =
            "Oh no! It seems like the Gemini model you entered is either down or not correct or that there is no internet connection. Make sure you didn't make any errors when inputting it in the settings. You can always use the default extension model (sent in the next message). Check your connection either way";

          this.initializeTextBox(
            "geminiMessage",
            response,
            BACKGROUND_COLOR_GEMINI_MESSAGE,
            COLOR_GEMINI_MESSAGE
          );
          this.initializeTextBox(
            "geminiMessage",
            "gemini-pro",
            BACKGROUND_COLOR_GEMINI_MESSAGE,
            COLOR_GEMINI_MESSAGE
          );

          let settingsButton = new St.Button({
            label: "Click here to check or change your model ID",
            can_focus: true,
            toggle_mode: true,
          });

          settingsButton.connect("clicked", (self) => {
            this.openSettings();
          });

          this.chatBox.add_child(settingsButton);

          this.chatInput.set_reactive(true);
          this.chatInput.set_text("");
          console.error("Error during Gemini API call:", error);
        }
    }
    initializeTextBox(type, text, color, textColor) {
        let box = new St.BoxLayout({
            vertical: true,
            style_class: `${type}-box`,
        });

        // text has to be a string
        let label = new St.Label({
            style_class: type,
            style: `background-color: ${color}; color: ${textColor}`,
            y_expand: true,
            reactive: true,
        });

        label.clutter_text.single_line_mode = false;
        label.clutter_text.line_wrap = true;
        label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

        box.add_child(label);

        if (type != "humanMessage") {
            label.connect("button-press-event", (actor) => {
            this.clipboard.set_text(
                St.ClipboardType.CLIPBOARD,
                label.clutter_text.get_text()
            );
            });

            label.connect("enter-event", (actor) => {
            if (this.chatInput.get_text() == "") {
                this.timeoutCopy = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                0.4,
                () => {
                    this.chatInput.set_reactive(false);
                    this.chatInput.set_text("Click on text to copy");
                }
                );
            }
            });

            label.connect("leave-event", (actor) => {
            if (this.timeoutCopy) {
                GLib.Source.remove(this.timeoutCopy);
                this.timeoutCopy = null;
            }

            if (this.chatInput.get_text() == "Click on text to copy") {
                this.chatInput.set_reactive(true);
                this.chatInput.set_text("");
            }
            });
        }

        label.clutter_text.set_markup(text);
        this.chatBox.add_child(box);
    }
        openSettings() {
            this.openSettings();
        }

       destroy() {
        if (this._settingsChangedId) {
            this.settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        if (this.timeoutCopy) {
            GLib.Source.remove(this.timeoutCopy);
        }
        if (this.timeoutResponse) {
            GLib.Source.remove(this.timeoutResponse);
        }
        HISTORY = null;
        super.destroy();
      }
    }
);


export default class GeminiExtension extends Extension {
    enable() {
        this._indicator = new GeminiIndicator(
            this,
            this.getSettings(),
            St.Clipboard.get_default(),
            this.openPreferences.bind(this),
            this.uuid
        );
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}