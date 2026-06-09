export { parseXsdSchema, resolveElements, findTypesExtending } from "./XsdSchema"
export type { XsdSchemaRegistry, XsdComplexType, XsdSimpleType, XsdElementDef } from "./XsdSchema"
export {
	loadSchema,
	validateXml,
	validateXmlFile,
	validateXmlFileWithBusinessRules,
	checkBusinessRules,
	detectMetadataType,
} from "./XsdValidator"
export type { XsdValidationResult, XsdValidationError } from "./XsdValidator"
