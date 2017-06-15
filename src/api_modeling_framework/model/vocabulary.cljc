(ns api-modeling-framework.model.vocabulary)

(defn meta-ns
  ([] "http://raml.org/vocabularies/meta#")
  ([s] (str (meta-ns) s)))

(defn document-ns
  ([] "http://raml.org/vocabularies/document#")
  ([s] (str (document-ns) s)))

(defn http-ns
  ([] "http://raml.org/vocabularies/http#")
  ([s] (str (http-ns) s)))

(defn shapes-ns
  ([] "http://raml.org/vocabularies/shapes#")
  ([s] (str (shapes-ns) s)))

(defn sh-ns
  ([] "http://www.w3.org/ns/shacl#")
  ([s] (str (sh-ns) s)))

(defn sorg-ns
  ([] "http://schema.org/")
  ([s] (str (sorg-ns) s)))

(defn hydra-ns
  ([] "http://www.w3.org/ns/hydra/core#")
  ([s] (str (hydra-ns) s)))

(defn xsd-ns
  ([] "http://www.w3.org/2001/XMLSchema#")
  ([s] (str (xsd-ns) s)))

(defn anon-shapes-ns
  ([] "http://raml.org/vocabularies/shapes/anon#")
  ([s] (str (anon-shapes-ns) s)))

(defn owl-ns
  ([] "http://www.w3.org/2002/07/owl#")
  ([s] (str (owl-ns) s)))

(defn rdfs-ns
  ([] "http://www.w3.org/2000/01/rdf-schema#")
  ([s] (str (rdfs-ns) s)))

(def rdfs:subclassOf (rdfs-ns "subClassOf"))
(def owl:Class (owl-ns "Class"))
(def owl:Thing (owl-ns "Thing"))

(def document:Vocabulary (document-ns "Vocabulary"))

(def document:Document (document-ns "Document"))
(def document:Fragment (document-ns "Fragment"))
(def document:Module (document-ns "Module"))
(def document:Unit (document-ns "Unit"))
(def document:SourceMap (document-ns "SourceMap"))
(def document:Tag (document-ns "Tag"))
(def document:DomainElement (document-ns "DomainElement"))
(def document:AbstractDomainElement (document-ns "AbstractDomainElement"))
(def document:ExtendRelationship (document-ns "ExtendRelationship"))
(def document:IncludeRelationship (document-ns "IncludeRelationship"))

(def document:source (document-ns "source"))
(def document:location (document-ns "location"))
(def document:declares (document-ns "declares"))
(def document:references (document-ns "references"))
(def document:encodes (document-ns "encodes"))
(def document:tag (document-ns "tag"))
(def document:tag-id (document-ns "tagId"))
(def document:tag-value (document-ns "tagValue"))
(def document:extends (document-ns "extends"))
(def document:target (document-ns "target"))
(def document:label (document-ns "label"))
(def document:arguments (document-ns "arguments"))
(def document:fragment-node (document-ns "fragmentNode"))
(def document:additional-properties (document-ns "additionalProperties"))
(def document:declaration-property (document-ns "declarationProperty"))

(def document:abstract (document-ns "abstractDomainElement"))

(def http:APIDocumentation (http-ns "APIDocumentation"))
(def sorg:name (sorg-ns "name"))
(def sorg:description (sorg-ns "description"))
(def http:host (http-ns "host"))
(def http:scheme (http-ns "scheme"))
(def http:base-path (http-ns "basePath"))
(def http:accepts (http-ns "accepts"))
(def http:content-type (http-ns "contentType"))
(def sorg:provider (sorg-ns "provider"))
(def http:terms-of-service (http-ns "termsOfService"))
(def sorg:version (sorg-ns "version"))
(def sorg:license (sorg-ns "license"))
(def http:endpoint (http-ns "endpoint"))


(def http:EndPoint (http-ns "EndPoint"))
(def hydra:supportedOperation (hydra-ns "supportedOperation"))
(def http:path (http-ns "path"))

(def hydra:Operation (hydra-ns "Operation"))
(def hydra:method (hydra-ns "method"))
(def hydra:returns (hydra-ns "returns"))
(def hydra:expects (hydra-ns "expects"))


(def http:Response (http-ns "Response"))
(def hydra:statusCode (hydra-ns "statusCode"))
(def http:payload (http-ns "payload"))

(def http:Payload (http-ns "Payload"))
(def http:media-type (http-ns "mediaType"))
(def http:schema (http-ns "schema"))

(def sh:Shape (sh-ns "Shape"))

(def http:Request (http-ns "Request"))
(def http:parameter (http-ns "parameter"))

(def http:Parameter (http-ns "Parameter"))
(def hydra:required (hydra-ns "required"))
(def http:param-binding (http-ns "paramBinding"))

(def document:DomainPropertySchema (document-ns "DomainPropertySchema"))
(def document:domain (document-ns "domain"))
(def document:range (document-ns "range"))

(def document:DomainProperty (document-ns "DomainProperty"))
(def document:object (document-ns "object"))

(def meta:version (meta-ns "version"))
(def meta:dialect (meta-ns "dialect"))
(def meta:classes (meta-ns "classes"))
(def meta:properties (meta-ns "properties"))

(def meta:vocabulary (meta-ns "vocabulary"))
(def meta:external (meta-ns "external"))