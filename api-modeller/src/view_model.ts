import * as ko from "knockout";
import { LoadModal, LoadFileEvent } from "./view_models/load_modal";
import { ModelProxy, ModelLevel } from "./main/model_proxy";
import { remote } from "electron";
import { ApiModellerWindow } from "./main/api_modeller_window";
import { Nav } from "./view_models/nav";
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import createModel = monaco.editor.createModel;
import {Document, Fragment, Module, DocumentId, Unit} from "./main/units_model";
import * as units_model from "./main/units_model";
import { label } from "./utils";
import { UI } from "./view_models/ui";
import { DomainElement, DomainModel } from "./main/domain_model";
import {Query} from "./view_models/query";
import {type} from "os";

export type NavigatorSection = "files" | "logic" | "domain";
export type EditorSection = "raml" | "open-api" | "api-model" | "diagram" | "query";

export interface ReferenceFile {
    id: string;
    label: string;
    type: "local" | "remote"
}

export class ViewModel {

    // The model information stored as the global information, this will be used to generate the units and
    // navigation options, subsets of this model can be selected anc become the active model
    public documentModel?: ModelProxy = undefined;
    // The global 'level' for the active document
    public documentLevel: ModelLevel = "document";
    // The model used to show the spec text in the editor, this can change as different parts fo the global
    // model are selected and we need to show different spec texts
    public model?: ModelProxy = undefined;
    public referenceToDomainUnits: { [id: string]: DomainModel[] } = {};

    // Observables for the main interface state
    public navigatorSection: KnockoutObservable<NavigatorSection> = ko.observable<NavigatorSection>("files");
    public editorSection: KnockoutObservable<EditorSection> = ko.observable<EditorSection>("raml");
    public references: KnockoutObservableArray<ReferenceFile> = ko.observableArray<ReferenceFile>([]);
    public selectedReference: KnockoutObservable<ReferenceFile | null> = ko.observable<ReferenceFile | null>(null);
    public documentUnits: KnockoutObservableArray<Document> = ko.observableArray<Document>([]);
    public fragmentUnits: KnockoutObservableArray<Fragment> = ko.observableArray<Fragment>([]);
    public moduleUnits: KnockoutObservableArray<Module> = ko.observableArray<Module>([]);
    public domainUnits: KnockoutObservable<{ [kind: string]: DomainElement[] }> = ko.observable<{ [kind: string]: DomainElement[] }>({});
    public generationOptions: KnockoutObservable<any> = ko.observable<any>({ "source-maps?": false });
    public generateSourceMaps: KnockoutObservable<string> = ko.observable<string>("no");
    public focusedId: KnockoutObservable<string> = ko.observable<string>("");

    // Nested interfaces
    public ui: UI = new UI();
    public nav: Nav = new Nav("document");
    public loadModal: LoadModal = new LoadModal();
    public diagram: any;
    public query: Query = new Query();

    constructor(public editor: IStandaloneCodeEditor) {
        // events we are subscribed
        this.loadModal.on(LoadModal.LOAD_FILE_EVENT, (data: LoadFileEvent) => {
            this.apiModellerWindow().parseModelFile(data.type, data.location, (err, model) => {
                if (err) {
                    console.log(err);
                    alert(err);
                } else {
                    this.documentModel = model;
                    this.model = model;
                    this.selectedReference(this.makeReference(this.documentModel!.location(), this.documentModel!.location()));
                    this.focusedId(this.documentModel!.location());
                    this.resetUnits();
                    this.resetReferences();
                    this.resetDocuments();
                }
            });
        });
        this.navigatorSection.subscribe((section) => {
            switch(section) {
                case "files": {
                    if (this.model && this.selectedReference() && this.model.location() !== this.selectedReference()!.id) {
                        this.selectNavigatorFile(this.selectedReference()!);
                    }
                    break;
                }
                case "logic": {
                    if (this.model && this.selectedReference() && this.model.location() !== this.selectedReference()!.id) {
                        this.selectNavigatorFile(this.selectedReference()!);
                    }
                    break;
                }
                case "domain": {
                    break;
                }
            }
            this.resetDiagram();
        });

        this.nav.on(Nav.DOCUMENT_LEVEL_SELECTED_EVENT, (level: ModelLevel) => {
            this.onDocumentLevelChange(level);
        });
        this.generateSourceMaps.subscribe((generate) => {
            if (generate === "yes") {
                this.generationOptions()["source-maps?"] = true;
            } else {
                this.generationOptions()["source-maps?"] = false;
            }
            this.resetDocuments();
        });
        this.editorSection.subscribe((section) => this.onEditorSectionChange(section));
    }

    public selectNavigatorFile(reference: ReferenceFile) {
        this.selectedReference(reference);
        this.focusedId(reference.id);
        if (this.documentModel != null) {
            if (this.documentModel.location() !== reference.id) {
                this.model = this.documentModel.nestedModel(reference.id);
            } else {
                this.model = this.documentModel;
            }
            this.resetDocuments()
        }
        this.resetDiagram();
        this.resetDomainUnits();
    }


    public pathTo(target: string, next: any, acc: any[]) {
        if (next != null && (typeof(next) === "object" && next.id != null || next.root || next.encodes || next.declares || next.references)) {
            if (next.id === target) {
                return acc.concat([next]);
            } else {
                for (var p in next) {
                    if (next.hasOwnProperty(p)) {
                        const elem = next[p];
                        if (elem instanceof Array) {
                            for (let i = 0; i < elem.length; i++) {
                                const item = elem[i];

                                const res = this.pathTo(target, item, acc.concat([next]));
                                if (res != null) {
                                    return res;
                                }
                            }
                        } else {
                            const res = this.pathTo(target, elem, acc.concat([next]));
                            if (res != null) {
                                return res;
                            }
                        }
                    }
                }
            }
        }
    }


    public expandDomainUnit(unit: DomainElement) {
        unit["expanded"] = !unit["expanded"];
        if (unit["expanded"]) {
            const units = this.allUnits();
            for (let i = 0; i < units.length; i++) {
                const domain = units[i];
                const elems = this.pathTo(unit.id, domain, []);
                if (elems) {
                    elems.forEach(elem => elem["expanded"] = true);
                    break;
                }
            }
        }
        this.focusedId(unit.id);
        this.domainUnits({});
        this.resetDomainUnits();
        this.resetDiagram();
        this.selectElementDocument(unit);
    }

    public selectElementDocument(unit: DomainElement) {
        if (this.documentModel) {
            const topLevelUnit = this.isTopLevelUnit(unit);
            if (topLevelUnit != null) {
                const foundRef = this.references().find(ref => unit.id.startsWith(ref.id));
                if (foundRef) {
                    this.selectNavigatorFile(foundRef);
                }
            } else {
                const unitModel = this.documentModel.findElement(this.documentLevel, unit.id);
                if (unitModel != null) {
                    this.model = unitModel;
                    this.resetDocuments();
                } else {
                    console.log(`Cannot find element with id ${unit.id}`);
                }
            }
        }
    }

    public isTopLevelUnit(unit: DomainElement) {
        for (var kind in this.domainUnits()) {
            const found = this.domainUnits()[kind].find( domainUnit => domainUnit.id === unit.id);
            if (found != null) {
                return found;
            }
        }
    }

    private onDocumentLevelChange(level: ModelLevel) {
        console.log(`** New document level ${level}`);
        this.documentLevel = level;
        if (level === "domain" && this.documentModel) {
            this.model = this.documentModel;
            this.selectedReference(this.makeReference(this.documentModel.location(), this.documentModel.location()));
        }
        this.resetDocuments();
        this.resetReferences();
        this.resetUnits();
    }



    protected apiModellerWindow(): ApiModellerWindow { return remote.getCurrentWindow() as ApiModellerWindow; }

    apply(location: Node) {
        window["viewModel"] = this;
        ko.applyBindings(this);
    }


    // Reset the view model state when a document has changed
    private resetDocuments() {
        if (this.model != null) {
            // We generate the RAML representation
            this.model.toRaml(this.documentLevel, this.generationOptions(), (err, string) => {
                if (err != null) {
                    console.log("Error generating RAML");
                    console.log(err);
                } else {
                    if (this.editorSection() === "raml") {
                        this.editor.setModel(createModel(this.model!.ramlString, "yaml"));
                    }
                }
            });

            // We generate the OpenAPI representation
            this.model.toOpenAPI(this.documentLevel, this.generationOptions(), (err, string) => {
                if (err != null) {
                    console.log("Error getting OpenAPI");
                    console.log(err);
                } else {
                    if (this.editorSection() === "open-api") {
                        this.editor.setModel(createModel(this.model!.openAPIString, "json"));
                    }
                    this.resetQuery();
                }
            });

            // We generate the APIModel representation
            this.model.toAPIModel(this.documentLevel, this.generationOptions(), (err, string) => {
                if (err != null) {
                    console.log("Error getting ApiModel");
                    console.log(err);
                } else {
                    if (this.editorSection() === "api-model") {
                        this.editor.setModel(createModel(this.model!.apiModeltring, "json"));
                    }
                }
            });
        }
    }

    public resetDomainUnits() {
        const ref = this.selectedReference();
        const units = {};
        if (ref != null) {
            const domains = this.referenceToDomainUnits[ref.id] || [];
            domains.forEach(domain => {
                if (domain.root != null) {
                    const acc = units[domain.root.kind] || [];
                    acc.push(domain.root);
                    units[domain.root.kind] = acc;
                }
            });

        }
        this.domainUnits(units);
    }

    private onEditorSectionChange(section: EditorSection) {
        // Warning, models here mean MONACO EDITOR MODELS, don't get confused with API Models
        if (section === "raml") {
            if (this.model != null) {
                this.editor.setModel(createModel(this.model.ramlString, "yaml"));
            } else {
                this.editor.setModel(createModel("# no model loaded", "yaml"));
            }
            window['resizeFn']();
        } else if (section === "open-api") {
            if (this.model != null) {
                this.editor.setModel(createModel(this.model!.openAPIString, "json"));
            } else {
                this.editor.setModel(createModel("// no model loaded", "json"));
            }
            window['resizeFn']();
        } else if (section === "api-model") {
            if (this.model != null) {
                this.editor.setModel(createModel(this.model!.apiModeltring, "json"));
            } else {
                this.editor.setModel(createModel("// no model loaded", "json"));
            }
            window['resizeFn']();
        } else if (section === "diagram") {
            this.resetDiagram();
        } else {

        }
    }

    private onSelectedDiagramId(id, unit) {
        const foundReference = this.references().find(ref => ref.id === id);
        if (foundReference) {
            this.selectNavigatorFile(foundReference);
        } else {
            if (this.navigatorSection() === "domain") {
                this.expandDomainUnit(unit)
            }
        }
    }

    private allUnits() {
        // Collecting the units for the diagram
        const units: (DocumentId & Unit)[] = ([] as (DocumentId & Unit)[])
            .concat(this.documentUnits())
            .concat(this.fragmentUnits())
            .concat(this.moduleUnits());
        return units;
    }

    public resetDiagram() {

        let level = "files";
        if (this.navigatorSection() === "domain") {
            level = "domain";
        } else if (this.navigatorSection() === "logic") {
            level = "document";
        }
        this.diagram = new (require("./view_models/diagram").Diagram)(
            this.focusedId(),
            level,
            (id: string, unit: any) => {
                this.onSelectedDiagramId(id, unit);
            }
        );
        this.diagram.process(this.allUnits());
        this.diagram.render("graph-container");
    }

    // Reset the list of references for the current model
    private resetReferences() {
        console.log("** Setting references");
        if (this.model != null && this.documentModel != null) {
            const location = this.model.location();
            if (this.documentLevel === "document") {
                this.references.removeAll();
                this.documentModel.references().forEach(ref => this.references.push(this.makeReference(location, ref)));
            } else {
                const documentModelReference = this.makeReference(location, location);
                this.references.removeAll();
                this.references.push(documentModelReference);
            }
        }
    }

    private makeReference(currentLocation: string, reference: string): ReferenceFile {
        console.log("*** Making reference " + reference);
        const parts = currentLocation.split("/");
        parts.pop();
        const currentLocationDir = parts.join("/") + "/";
        const isRemote = reference.startsWith("http");
        if (reference.startsWith(currentLocationDir)) {
            return {
                type: (isRemote ? "remote" : "local"),
                id: reference,
                label: label(reference)
            }
        } else {
            return {
                type: (isRemote ? "remote" : "local"),
                id: reference,
                label: label(reference),
            }
        }
    }

    private resetUnits() {
        if (this.documentModel != null) {
            this.documentModel.units(this.documentLevel, (err, units) => {
                if (err == null) {
                    console.log("Got the new units");
                    // reseting data
                    this.referenceToDomainUnits = {};
                    this.documentUnits.removeAll();
                    // Indexing document and domain units
                    units.documents.forEach(doc => {
                        this.indexDomainUnits(doc);
                        this.documentUnits.push(doc)
                    });
                    this.fragmentUnits.removeAll();
                    units.fragments.forEach(fragment => {
                        this.indexDomainUnits(fragment);
                        this.fragmentUnits.push(fragment)
                    });
                    this.moduleUnits.removeAll();
                    units.modules.forEach(module => {
                        this.indexDomainUnits(module);
                        this.moduleUnits.push(module)
                    });
                } else {
                    console.log("Error loading units");
                    console.log(err);
                }
            });
        } else {
            this.documentUnits.removeAll();
            this.fragmentUnits.removeAll();
            this.moduleUnits.removeAll();
        }
    }

    private indexDomainUnits(elm: Document | Fragment | Module) {
        console.log("INDEXING DOMAIN UNITS FOR " + elm.kind);
        const units: DomainModel[] = [];
        const reference = elm.id;
        this.referenceToDomainUnits[reference] = units;

        if (elm.kind === "Document") {
            const document = (elm as Document);
            if (document && document.encodes) {
                units.push(document.encodes.domain)
            }
            document.declares.forEach(dec => {
                units.push(dec.domain);
            })
        } else if (elm.kind === "Fragment") {
            const document = (elm as Fragment);
            if (document && document.encodes) {
                units.push(document.encodes.domain);
            }
        } else if (elm.kind === "Module") {
            const document = (elm as Module);
            document.declares.forEach(dec => {
                units.push(dec.domain);
            })
        }

        if (this.selectedReference() != null && this.selectedReference() !.id === reference) {
            console.log("Adding default domain units " + reference);
            this.resetDomainUnits();
        }
    }

    resetQuery() {
        if (this.model && this.model.apiModeltring && this.model.apiModeltring !== "") {
            this.query.process(this.model.apiModeltring, (err, store) => {
                if (err) {
                    alert("Error loading data into string " + err);
                }
            });
        } else {
            console.log("Cannot load data in store, not ready yet");
        }
    }
}
