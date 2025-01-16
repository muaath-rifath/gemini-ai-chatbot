// Made by @martijara

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class GeminiPreferences extends ExtensionPreferences {
    fillPreferencesWindow (window) {
        window._settings = this.getSettings();
        const settingsUI = new Settings(window._settings);
        const page = new Adw.PreferencesPage();
        page.add(settingsUI.ui);
        window.add(page);
    }
}

class Settings {
    constructor (schema) {
        this.schema = schema;
        this.ui =  new Adw.PreferencesGroup({ title: _('Settings:') });
        this.main = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            row_spacing: 10,
            column_spacing: 14,
            column_homogeneous: false,
            row_homogeneous: false
        });


        // Getting necessary schema values
        const defaultKey = this.schema.get_string("gemini-api-key");
        const defaultModel = this.schema.get_string("gemini-model");
        const defaultHumanColor = this.schema.get_string("human-message-color");
        const defaultGeminiColor = this.schema.get_string("gemini-message-color");
         const defaultHumanTextColor = this.schema.get_string("human-message-text-color");
        const defaultGeminiTextColor = this.schema.get_string("gemini-message-text-color");
        const defaultTemperature = this.schema.get_double("temperature");
        const defaultMaxTokens = this.schema.get_int("max-tokens");


        // API Key Section
        const labelAPI = new Gtk.Label({
            label: _("Gemini API Key"),
            halign: Gtk.Align.START
        });
        const apiKey = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
        
       const howToAPI = new Gtk.LinkButton({
           label: _("How to get API key?"),
           uri: 'https://ai.google.dev/'
       });


        // LLM Model Section
        const labelModel = new Gtk.Label({
            label: _("Gemini model you want to use"),
            halign: Gtk.Align.START
        });
        const model = new Gtk.Entry({
            buffer: new Gtk.EntryBuffer()
        });
       const howToModel = new Gtk.LinkButton({
           label: _("List of models"),
           uri: 'https://ai.google.dev/models/gemini'
       });


          // Temperature Section
        const labelTemperature = new Gtk.Label({
            label: _("Temperature"),
            halign: Gtk.Align.START
        });
        const temperature = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
              lower: 0,
              upper: 1,
              step_increment: 0.1,
            }),
            digits: 1,
        });

        // Max Tokens Section
        const labelMaxTokens = new Gtk.Label({
            label: _("Max Tokens"),
            halign: Gtk.Align.START
        });
        const maxTokens = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 2048,
                step_increment: 1,
            }),
        });

           // Color Dialog
        let colorDialog = new Gtk.ColorDialog({
            with_alpha: false,
        });

        // Human Color Section
        const labelHumanColor = new Gtk.Label({
            label: _("BACKGROUND Color of YOUR message"),
            halign: Gtk.Align.START
        });

        

        let humanColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const humanColorGTK = humanColor.rgba;
        humanColorGTK.parse(defaultHumanColor);
        humanColor.set_rgba(humanColorGTK);

        


        // LLM Color Section
        const labelGeminiColor = new Gtk.Label({
            label: _("BACKGROUND Color of CHATBOT Message"),
            halign: Gtk.Align.START
        });



        let geminiColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const geminiColorGTK = geminiColor.rgba;
        geminiColorGTK.parse(defaultGeminiColor);
        geminiColor.set_rgba(geminiColorGTK);



         // Human Text Color Section
        const labelHumanTextColor = new Gtk.Label({
            label: _("TEXT Color of YOUR message"),
            halign: Gtk.Align.START
        });

        let humanTextColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const humanTextColorGTK = humanTextColor.rgba;
        humanTextColorGTK.parse(defaultHumanTextColor);
        humanTextColor.set_rgba(humanTextColorGTK);

        


        // LLM Text Color Section
        const labelGeminiTextColor = new Gtk.Label({
            label: _("TEXT Color of the CHATBOT Message"),
            halign: Gtk.Align.START
        });


        let geminiTextColor = new Gtk.ColorDialogButton({
            valign: Gtk.Align.CENTER,
            dialog: colorDialog,
        });

        const geminiTextColorGTK = geminiTextColor.rgba;
        geminiTextColorGTK.parse(defaultGeminiTextColor);
        geminiTextColor.set_rgba(geminiTextColorGTK);


       
        const save = new Gtk.Button({
            label: _('Save')
        });
        const statusLabel = new Gtk.Label({
            label: "Not yet saved. Click on the Save button above for your preferences to be saved",
            useMarkup: true,
            halign: Gtk.Align.CENTER
        });


        // Initial display of set values
        apiKey.set_text(defaultKey);
        model.set_text(defaultModel);
        temperature.set_value(defaultTemperature);
        maxTokens.set_value(defaultMaxTokens)

        save.connect('clicked', () => {
            this.schema.set_string("gemini-api-key", apiKey.get_buffer().get_text());
             this.schema.set_string("gemini-model", model.get_buffer().get_text());
           this.schema.set_string("human-message-color", `${humanColor.get_rgba().to_string()}`);
            this.schema.set_string("gemini-message-color", `${geminiColor.get_rgba().to_string()}`);
            this.schema.set_string("human-message-text-color", `${humanTextColor.get_rgba().to_string()}`);
            this.schema.set_string("gemini-message-text-color", `${geminiTextColor.get_rgba().to_string()}`);
            this.schema.set_double("temperature", temperature.get_value());
            this.schema.set_int("max-tokens", maxTokens.get_value());
            statusLabel.set_markup(_("Saved"));
        });

        // Displaying everything
        // col, row, 1, 1
        this.main.attach(labelAPI, 0, 0, 1, 1);
        this.main.attach(apiKey, 2, 0, 2, 1);
        this.main.attach(howToAPI, 4, 0, 2, 1);

        this.main.attach(labelModel, 0, 1, 1, 1);
        this.main.attach(model, 2, 1, 2, 1);
         this.main.attach(howToModel, 4, 1, 2, 1);
        
         this.main.attach(labelTemperature, 0, 2, 1, 1);
         this.main.attach(temperature, 2, 2, 1, 1);
        
        this.main.attach(labelMaxTokens, 0, 3, 1, 1);
        this.main.attach(maxTokens, 2, 3, 1, 1);
        

        this.main.attach(labelHumanColor, 0, 4, 1, 1);
        this.main.attach(humanColor, 2, 4, 2, 1);

          this.main.attach(labelHumanTextColor, 0, 5, 1, 1);
        this.main.attach(humanTextColor, 2, 5, 2, 1);


        this.main.attach(labelGeminiColor, 0, 6, 1, 1);
        this.main.attach(geminiColor, 2, 6, 2, 1);

           this.main.attach(labelGeminiTextColor, 0, 7, 1, 1);
        this.main.attach(geminiTextColor, 2, 7, 2, 1);


        this.main.attach(save, 2, 8, 1, 1);
        this.main.attach(statusLabel, 0, 9, 4, 1);

        this.ui.add(this.main);
    }
}