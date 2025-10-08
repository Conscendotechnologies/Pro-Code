<!-- Flow -->

<xsd:complexType name="Flow">
<xsd:complexContent>
<xsd:extension base="tns:Metadata">
<xsd:sequence>
<xsd:element name="actionCalls" minOccurs="0" maxOccurs="unbounded" type="tns:FlowActionCall"/>
<xsd:element name="apexPluginCalls" minOccurs="0" maxOccurs="unbounded" type="tns:FlowApexPluginCall"/>
<xsd:element name="apiVersion" minOccurs="0" type="xsd:double" nillable="true"/>
<xsd:element name="areMetricsLoggedToDataCloud" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="assignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowAssignment"/>
<xsd:element name="choices" minOccurs="0" maxOccurs="unbounded" type="tns:FlowChoice"/>
<xsd:element name="collectionProcessors" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCollectionProcessor"/>
<xsd:element name="constants" minOccurs="0" maxOccurs="unbounded" type="tns:FlowConstant"/>
<xsd:element name="customErrors" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCustomError"/>
<xsd:element name="customProperties" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCustomProperty"/>
<xsd:element name="decisions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowDecision"/>
<xsd:element name="description" minOccurs="0" type="xsd:string"/>
<xsd:element name="dynamicChoiceSets" minOccurs="0" maxOccurs="unbounded" type="tns:FlowDynamicChoiceSet"/>
<xsd:element name="environments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowEnvironment"/>
<xsd:element name="exitRules" minOccurs="0" maxOccurs="unbounded" type="tns:FlowExitRule"/>
<xsd:element name="experiments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowExperiment"/>
<xsd:element name="formulas" minOccurs="0" maxOccurs="unbounded" type="tns:FlowFormula"/>
<xsd:element name="interviewLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="isAdditionalPermissionRequiredToRun" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isOverridable" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isTemplate" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="loops" minOccurs="0" maxOccurs="unbounded" type="tns:FlowLoop"/>
<xsd:element name="migratedFromWorkflowRuleName" minOccurs="0" type="xsd:string"/>
<xsd:element name="orchestratedStages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowOrchestratedStage"/>
<xsd:element name="overriddenFlow" minOccurs="0" type="xsd:string"/>
<xsd:element name="processMetadataValues" minOccurs="0" maxOccurs="unbounded" type="tns:FlowMetadataValue"/>
<xsd:element name="processType" minOccurs="0" type="tns:FlowProcessType"/>
<xsd:element name="recordCreates" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordCreate"/>
<xsd:element name="recordDeletes" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordDelete"/>
<xsd:element name="recordLookups" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordLookup"/>
<xsd:element name="recordRollbacks" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordRollback"/>
<xsd:element name="recordUpdates" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordUpdate"/>
<xsd:element name="runInMode" minOccurs="0" type="tns:FlowRunInMode"/>
<xsd:element name="screens" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreen"/>
<xsd:element name="sourceTemplate" minOccurs="0" type="xsd:string"/>
<xsd:element name="stages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStage"/>
<xsd:element name="start" minOccurs="0" type="tns:FlowStart"/>
<xsd:element name="status" minOccurs="0" type="tns:FlowVersionStatus"/>
<xsd:element name="steps" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStep"/>
<xsd:element name="subflows" minOccurs="0" maxOccurs="unbounded" type="tns:FlowSubflow"/>
<xsd:element name="textTemplates" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTextTemplate"/>
<xsd:element name="timeZoneSidKey" minOccurs="0" type="xsd:string"/>
<xsd:element name="transforms" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransform"/>
<xsd:element name="triggerOrder" minOccurs="0" type="xsd:int" nillable="true"/>
<xsd:element name="variables" minOccurs="0" maxOccurs="unbounded" type="tns:FlowVariable"/>
<xsd:element name="waits" minOccurs="0" maxOccurs="unbounded" type="tns:FlowWait"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStart -->

<xsd:complexType name="FlowStart">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="activation" minOccurs="0" type="xsd:string"/>
<xsd:element name="capabilityTypes" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCapability"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="dataGraph" minOccurs="0" type="xsd:string"/>
<xsd:element name="dataTypeMappings" minOccurs="0" maxOccurs="unbounded" type="tns:FlowDataTypeMapping"/>
<xsd:element name="doesRequireRecordChangedToMeetCriteria" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="entryType" minOccurs="0" type="tns:FlowEntryType"/>
<xsd:element name="eventName" minOccurs="0" type="xsd:string"/>
<xsd:element name="eventType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="filterFormula" minOccurs="0" type="xsd:string"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="flowRunAsUser" minOccurs="0" type="tns:FlowRunAsUser"/>
<xsd:element name="form" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputs" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStartInputParameter"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
<xsd:element name="objectContainer" minOccurs="0" type="xsd:string"/>
<xsd:element name="publishSegment" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="recordTriggerType" minOccurs="0" type="tns:RecordTriggerType"/>
<xsd:element name="schedule" minOccurs="0" type="tns:FlowSchedule"/>
<xsd:element name="scheduledPaths" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScheduledPath"/>
<xsd:element name="segment" minOccurs="0" type="xsd:string"/>
<xsd:element name="triggerType" minOccurs="0" type="tns:FlowTriggerType"/>
<xsd:element name="triggeringDataGraph" minOccurs="0" type="xsd:string"/>
<xsd:element name="triggeringDataModelObjectPath" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowConnector -->

<xsd:complexType name="FlowConnector">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="isGoTo" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="targetReference" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowBaseElement -->

<xsd:complexType name="FlowBaseElement">
<xsd:sequence>
<xsd:element name="processMetadataValues" minOccurs="0" maxOccurs="unbounded" type="tns:FlowMetadataValue"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowMetadataValue -->

<xsd:complexType name="FlowMetadataValue">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowElementReferenceOrValue -->

<xsd:complexType name="FlowElementReferenceOrValue">
<xsd:sequence>
<xsd:element name="apexValue" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="booleanValue" minOccurs="0" type="xsd:boolean" nillable="true"/>
<xsd:element name="complexValue" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="complexValueType" minOccurs="0" type="tns:FlowComplexValueType" nillable="true"/>
<xsd:element name="dateTimeValue" minOccurs="0" type="xsd:dateTime"/>
<xsd:element name="dateValue" minOccurs="0" type="xsd:date"/>
<xsd:element name="elementReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="formulaDataType" minOccurs="0" type="tns:FlowDataType" nillable="true"/>
<xsd:element name="formulaExpression" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="numberValue" minOccurs="0" type="xsd:double" nillable="true"/>
<xsd:element name="setupReference" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="setupReferenceType" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="sobjectValue" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="stringValue" minOccurs="0" type="xsd:string"/>
<xsd:element name="timeValue" minOccurs="0" type="xsd:time"/>
<xsd:element name="transform" minOccurs="0" type="tns:FlowInlineTransform" nillable="true"/>
<xsd:element name="transformValueReference" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<xsd:simpleType name="FlowComplexValueType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="JoinDefinition"/>
<xsd:enumeration value="FieldReference"/>
<xsd:enumeration value="ResourceDescriptor"/>
<xsd:enumeration value="ResourceAnnotationMap"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowDataType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Currency"/>
<xsd:enumeration value="Date"/>
<xsd:enumeration value="Number"/>
<xsd:enumeration value="String"/>
<xsd:enumeration value="Boolean"/>
<xsd:enumeration value="SObject"/>
<xsd:enumeration value="DateTime"/>
<xsd:enumeration value="Time"/>
<xsd:enumeration value="Picklist"/>
<xsd:enumeration value="Multipicklist"/>
<xsd:enumeration value="Apex"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowNode / FlowElement / Metadata base -->

<xsd:complexType name="FlowElement">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="description" minOccurs="0" type="xsd:string"/>
<xsd:element name="name" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowNode">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="elementSubtype" minOccurs="0" type="tns:FlowElementSubtype"/>
<xsd:element name="label" minOccurs="0" type="xsd:string"/>
<xsd:element name="locationX" type="xsd:int"/>
<xsd:element name="locationY" type="xsd:int"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="Metadata">
<xsd:sequence>
<xsd:element name="fullName" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
<xsd:attribute name="xmlns" type="xsd:string"/>
</xsd:complexType>

<!-- FlowScreenAction / FlowScreenField -->

<xsd:complexType name="FlowScreenAction">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="actionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="actionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenActionInputParameter"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="nameSegment" minOccurs="0" type="xsd:string"/>
<xsd:element name="versionSegment" minOccurs="0" type="xsd:int"/>
<xsd:element name="versionString" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenField">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="choiceReferences" minOccurs="0" maxOccurs="unbounded" type="xsd:string"/>
<xsd:element name="dataType" minOccurs="0" type="tns:FlowDataType"/>
<xsd:element name="dataTypeMappings" minOccurs="0" maxOccurs="unbounded" type="tns:FlowDataTypeMapping"/>
<xsd:element name="defaultSelectedChoiceReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="defaultValue" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="extensionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="fieldText" minOccurs="0" type="xsd:string"/>
<xsd:element name="fieldType" type="tns:FlowScreenFieldType"/>
<xsd:element name="fields" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenField"/>
<xsd:element name="helpText" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenFieldInputParameter"/>
<xsd:element name="inputsOnNextNavToAssocScrn" minOccurs="0" type="tns:FlowScreenFieldInputsRevisited"/>
<xsd:element name="isDisabled" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="isReadOnly" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="isRequired" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isVisible" minOccurs="0" type="xsd:boolean" nillable="true"/>
<xsd:element name="objectFieldReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="outputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenFieldOutputParameter"/>
<xsd:element name="regionContainerType" minOccurs="0" type="tns:FlowRegionContainerType"/>
<xsd:element name="scale" minOccurs="0" type="xsd:int"/>
<xsd:element name="sourceTemplateApiName" minOccurs="0" type="xsd:string"/>
<xsd:element name="sourceTemplateProviderType" minOccurs="0" type="xsd:string"/>
<xsd:element name="storeOutputAutomatically" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="styleProperties" minOccurs="0" type="tns:FlowScreenFieldStyleProperties"/>
<xsd:element name="validationRule" minOccurs="0" type="tns:FlowInputValidationRule"/>
<xsd:element name="visibilityRule" minOccurs="0" type="tns:FlowVisibilityRule"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStageStep and its parameter types -->

<xsd:complexType name="FlowStageStepEntryActionInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStageStepEntryActionOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStageStepExitActionInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStageStepExitActionOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStageStep">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="actionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="actionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="assignees" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepAssignee"/>
<xsd:element name="canAssigneeEdit" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="debugSimulateStep" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="entryActionInputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepEntryActionInputParameter"/>
<xsd:element name="entryActionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="entryActionOutputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepEntryActionOutputParameter"/>
<xsd:element name="entryActionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="entryConditionLogic" type="xsd:string"/>
<xsd:element name="entryConditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="exitActionInputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepExitActionInputParameter"/>
<xsd:element name="exitActionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="exitActionOutputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepExitActionOutputParameter"/>
<xsd:element name="exitActionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="exitConditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="exitConditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepInputParameter"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="outputConfigParams" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepOutputConfigParam"/>
<xsd:element name="outputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepOutputParameter"/>
<xsd:element name="requiresAsyncProcessing" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="runAsUser" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="shouldLock" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="stepSubtype" minOccurs="0" type="tns:FlowElementSubtype"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowExperimentPath -->

<xsd:complexType name="FlowExperimentPath">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="percentage" type="xsd:int"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowFerovTranslation (translation wrapper referenced in FlowInputParameterTranslation) -->

<xsd:complexType name="FlowFerovTranslation">
<xsd:sequence>
<xsd:element name="language" minOccurs="0" type="xsd:string"/>
<xsd:element name="text" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- Simple types: FlowProcessType, FlowComparisonOperator, IterationOrder -->

<xsd:simpleType name="FlowProcessType">
<xsd:restriction base="xsd:string">
<!-- AutoLaunchedFlow is for Record-Triggered Flows -->
<xsd:enumeration value="AutoLaunchedFlow"/>
<!-- Flow is for Screen Flows -->
<xsd:enumeration value="Flow"/>
<xsd:enumeration value="Workflow"/>
<xsd:enumeration value="CustomEvent"/>
<xsd:enumeration value="InvocableProcess"/>
<xsd:enumeration value="LoginFlow"/>
<xsd:enumeration value="ActionPlan"/>
<xsd:enumeration value="JourneyBuilderIntegration"/>
<xsd:enumeration value="UserProvisioningFlow"/>
<xsd:enumeration value="Survey"/>
<xsd:enumeration value="SurveyEnrich"/>
<xsd:enumeration value="Appointments"/>
<xsd:enumeration value="FSCLending"/>
<xsd:enumeration value="DigitalForm"/>
<xsd:enumeration value="FieldServiceMobile"/>
<xsd:enumeration value="OrchestrationFlow"/>
<xsd:enumeration value="FieldServiceWeb"/>
<xsd:enumeration value="TransactionSecurityFlow"/>
<xsd:enumeration value="ContactRequestFlow"/>
<xsd:enumeration value="ManagedContentFlow"/>
<xsd:enumeration value="CheckoutFlow"/>
<xsd:enumeration value="CartAsyncFlow"/>
<xsd:enumeration value="DataCaptureFlow"/>
<xsd:enumeration value="CustomerLifecycle"/>
<xsd:enumeration value="Journey"/>
<xsd:enumeration value="RecommendationStrategy"/>
<xsd:enumeration value="Orchestrator"/>
<xsd:enumeration value="RoutingFlow"/>
<xsd:enumeration value="ServiceCatalogItemFlow"/>
<xsd:enumeration value="EvaluationFlow"/>
<xsd:enumeration value="LoyaltyManagementFlow"/>
<xsd:enumeration value="ManagedContentAuthoringWorkflow"/>
<xsd:enumeration value="ActionCadenceAutolaunchedFlow"/>
<xsd:enumeration value="ActionCadenceStepFlow"/>
<xsd:enumeration value="IndicatorResultFlow"/>
<xsd:enumeration value="IndividualObjectLinkingFlow"/>
<xsd:enumeration value="PromptFlow"/>
<xsd:enumeration value="ApprovalWorkflow"/>
<xsd:enumeration value="DcvrFrameworkDataCaptureFlow"/>
<xsd:enumeration value="ActivityObjectMatchingFlow"/>
<xsd:enumeration value="ActionableEventManagementFlow"/>
<xsd:enumeration value="StageManagementEvaluationFlow"/>
<xsd:enumeration value="IdentityUserRegistrationFlow"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowComparisonOperator">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="None"/>
<xsd:enumeration value="EqualTo"/>
<xsd:enumeration value="NotEqualTo"/>
<xsd:enumeration value="GreaterThan"/>
<xsd:enumeration value="LessThan"/>
<xsd:enumeration value="GreaterThanOrEqualTo"/>
<xsd:enumeration value="LessThanOrEqualTo"/>
<xsd:enumeration value="StartsWith"/>
<xsd:enumeration value="EndsWith"/>
<xsd:enumeration value="Contains"/>
<xsd:enumeration value="IsNull"/>
<xsd:enumeration value="IsChanged"/>
<xsd:enumeration value="WasSet"/>
<xsd:enumeration value="WasSelected"/>
<xsd:enumeration value="WasVisited"/>
<xsd:enumeration value="In"/>
<xsd:enumeration value="NotIn"/>
<xsd:enumeration value="IsBlank"/>
<xsd:enumeration value="IsEmpty"/>
<xsd:enumeration value="HasError"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="IterationOrder">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Asc"/>
<xsd:enumeration value="Desc"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowEntryType -->

<xsd:simpleType name="FlowEntryType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Always"/>
<xsd:enumeration value="AfterCompletion"/>
<xsd:enumeration value="Never"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowRunAsUser -->

<xsd:simpleType name="FlowRunAsUser">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="TriggeringUser"/>
<xsd:enumeration value="DefaultWorkflowUser"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowSchedule -->

<xsd:complexType name="FlowSchedule">
<xsd:sequence>
<xsd:element name="frequency" minOccurs="0" type="tns:FlowStartFrequency"/>
<xsd:element name="startDate" minOccurs="0" type="xsd:date"/>
<xsd:element name="startTime" minOccurs="0" type="xsd:time"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowStartFrequency -->

<xsd:simpleType name="FlowStartFrequency">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="OnActivate"/>
<xsd:enumeration value="Once"/>
<xsd:enumeration value="Daily"/>
<xsd:enumeration value="Weekly"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowTriggerType -->

<xsd:simpleType name="FlowTriggerType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="None"/>
<xsd:enumeration value="Scheduled"/>
<xsd:enumeration value="RecordBeforeSave"/>
<xsd:enumeration value="RecordBeforeDelete"/>
<xsd:enumeration value="RecordAfterSave"/>
<xsd:enumeration value="PlatformEvent"/>
<xsd:enumeration value="EventDrivenJourney"/>
<xsd:enumeration value="Segment"/>
<xsd:enumeration value="DataCloudDataChange"/>
<xsd:enumeration value="FormSubmissionEvent"/>
<xsd:enumeration value="Capability"/>
<xsd:enumeration value="AutomationEvent"/>
<xsd:enumeration value="ExternalSystemChange"/>
<xsd:enumeration value="DataGraphDataChange"/>
<xsd:enumeration value="Activation"/>
<xsd:enumeration value="AdminAutomationEvent"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowRecordFilter -->

<xsd:complexType name="FlowRecordFilter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="field" minOccurs="0" type="xsd:string"/>
<xsd:element name="operator" minOccurs="0" type="tns:FlowRecordFilterOperator"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowRecordFilterOperator -->

<xsd:simpleType name="FlowRecordFilterOperator">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="EqualTo"/>
<xsd:enumeration value="NotEqualTo"/>
<xsd:enumeration value="GreaterThan"/>
<xsd:enumeration value="LessThan"/>
<xsd:enumeration value="GreaterThanOrEqualTo"/>
<xsd:enumeration value="LessThanOrEqualTo"/>
<xsd:enumeration value="StartsWith"/>
<xsd:enumeration value="EndsWith"/>
<xsd:enumeration value="Contains"/>
<xsd:enumeration value="IsNull"/>
<xsd:enumeration value="IsChanged"/>
<xsd:enumeration value="In"/>
<xsd:enumeration value="NotIn"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowStartInputParameter -->

<xsd:complexType name="FlowStartInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowDataTypeMapping -->

<xsd:complexType name="FlowDataTypeMapping">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="apexClass" minOccurs="0" type="xsd:string"/>
<xsd:element name="typeName" type="xsd:string"/>
<xsd:element name="typeValue" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowCapability -->

<xsd:complexType name="FlowCapability">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="capabilityName" type="xsd:string"/>
<xsd:element name="inputs" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCapabilityInput"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowCapabilityInput">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="capabilityInputName" type="xsd:string"/>
<xsd:element name="dataType" minOccurs="0" type="xsd:string"/>
<xsd:element name="isCollection" type="xsd:boolean"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowScheduledPath -->

<xsd:complexType name="FlowScheduledPath">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="label" minOccurs="0" type="xsd:string"/>
<xsd:element name="maxBatchSize" minOccurs="0" type="xsd:int"/>
<xsd:element name="offsetNumber" minOccurs="0" type="xsd:int"/>
<xsd:element name="offsetUnit" minOccurs="0" type="tns:FlowScheduledPathOffsetUnit"/>
<xsd:element name="pathType" minOccurs="0" type="tns:FlowScheduledPathType"/>
<xsd:element name="recordField" minOccurs="0" type="xsd:string"/>
<xsd:element name="timeSource" minOccurs="0" type="tns:FlowScheduledPathTimeSource"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowScheduledPathOffsetUnit">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Hours"/>
<xsd:enumeration value="Days"/>
<xsd:enumeration value="Minutes"/>
<xsd:enumeration value="Months"/>
<xsd:enumeration value="Weeks"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowScheduledPathType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="AsyncAfterCommit"/>
<xsd:enumeration value="ApprovalRecall"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowScheduledPathTimeSource">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="RecordTriggerEvent"/>
<xsd:enumeration value="RecordField"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowComplexValueType -->

<xsd:simpleType name="FlowComplexValueType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="JoinDefinition"/>
<xsd:enumeration value="FieldReference"/>
<xsd:enumeration value="ResourceDescriptor"/>
<xsd:enumeration value="ResourceAnnotationMap"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowDataType -->

<xsd:simpleType name="FlowDataType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Currency"/>
<xsd:enumeration value="Date"/>
<xsd:enumeration value="Number"/>
<xsd:enumeration value="String"/>
<xsd:enumeration value="Boolean"/>
<xsd:enumeration value="SObject"/>
<xsd:enumeration value="DateTime"/>
<xsd:enumeration value="Time"/>
<xsd:enumeration value="Picklist"/>
<xsd:enumeration value="Multipicklist"/>
<xsd:enumeration value="Apex"/>
</xsd:restriction>
</xsd:simpleType>

<!-- InvocableActionType (trimmed to keep file concise but preserved many enumerations) -->

<xsd:simpleType name="InvocableActionType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="getUpdtTermsForPymtDueDateMod"/>
<xsd:enumeration value="getUpdtTermsForPaymentDeferral"/>
<xsd:enumeration value="createMediaProposalItem"/>
<xsd:enumeration value="getMediaProducts"/>
<xsd:enumeration value="getMediaProductsUseSearchCrit"/>
<xsd:enumeration value="executeExternalAdSalesRequest"/>
<xsd:enumeration value="apex"/>
<xsd:enumeration value="chatterPost"/>
<xsd:enumeration value="findProviders"/>
<xsd:enumeration value="findProvidersInfo"/>
<xsd:enumeration value="getWaitlistParticipant"/>
<xsd:enumeration value="getWaitlistMetadata"/>
<xsd:enumeration value="bookAppointment"/>
<xsd:enumeration value="contentWorkspaceEnableFolders"/>
<xsd:enumeration value="emailAlert"/>
<xsd:enumeration value="emailSimple"/>
<xsd:enumeration value="externalService"/>
<xsd:enumeration value="externalConnector"/>
<xsd:enumeration value="externalEvent"/>
<xsd:enumeration value="salesforceAPIPlatform"/>
<xsd:enumeration value="namedQuery"/>
<xsd:enumeration value="flow"/>
<xsd:enumeration value="metricRefresh"/>
<xsd:enumeration value="quickAction"/>
<xsd:enumeration value="submit"/>
<xsd:enumeration value="thanks"/>
<xsd:enumeration value="thunderResponse"/>
<xsd:enumeration value="createServiceReport"/>
<xsd:enumeration value="deployOrchestration"/>
<xsd:enumeration value="createResponseEventAction"/>
<xsd:enumeration value="sfdcOutputAction"/>
<xsd:enumeration value="invokeOrchOutputFlow"/>
<xsd:enumeration value="generateWorkOrders"/>
<xsd:enumeration value="deactivateSessionPermSet"/>
<xsd:enumeration value="activateSessionPermSet"/>
<xsd:enumeration value="aggregateValue"/>
<xsd:enumeration value="orchestrationTimer"/>
<xsd:enumeration value="orchestrationDebugLog"/>
<xsd:enumeration value="choosePricebook"/>
<xsd:enumeration value="component"/>
<xsd:enumeration value="lwcComponent"/>
<xsd:enumeration value="liveMessageNotification"/>
<xsd:enumeration value="scaleCacheAsyncRefresh"/>
<xsd:enumeration value="skillsBasedRouting"/>
<xsd:enumeration value="addSkillRequirements"/>
<xsd:enumeration value="addScreenPop"/>
<xsd:enumeration value="findMatchingIndividuals"/>
<xsd:enumeration value="routeWork"/>
<xsd:enumeration value="scvOutboundCall"/>
<xsd:enumeration value="checkAvailabilityForRouting"/>
<xsd:enumeration value="createCustomField"/>
<xsd:enumeration value="assignTrailheadBadge"/>
<xsd:enumeration value="insightFeedback"/>
<xsd:enumeration value="publishKnowledgeArticles"/>
<xsd:enumeration value="routingAddressVerification"/>
<xsd:enumeration value="assignTargetToSalesCadence"/>
<xsd:enumeration value="removeTargetFromSalesCadence"/>
<xsd:enumeration value="modifyCadenceTrackerAttributes"/>
<xsd:enumeration value="invocableApplyLeadAssignmentRules"/>
<xsd:enumeration value="pauseSalesCadenceTracker"/>
<xsd:enumeration value="resumeSalesCadenceTracker"/>
<xsd:enumeration value="changeSalesCadenceTargetAssignee"/>
<xsd:enumeration value="sendSalesCadenceEvent"/>
<xsd:enumeration value="selectTemplateForSalesCadenceStepTracker"/>
<xsd:enumeration value="assignKnowledgeArticles"/>
<xsd:enumeration value="createDraftFromOnlineKnowledgeArticle"/>
<xsd:enumeration value="archiveKnowledgeArticles"/>
<xsd:enumeration value="restoreKnowledgeArticleVersion"/>
<xsd:enumeration value="customNotificationAction"/>
<xsd:enumeration value="broadcastRenderSlackMsgPreview"/>
<xsd:enumeration value="submitDigitalFormResponse"/>
<xsd:enumeration value="contactRequestAction"/>
<xsd:enumeration value="saveAppointment"/>
<xsd:enumeration value="saveAppointmentInvitationDetails"/>
<xsd:enumeration value="createWaitlist"/>
<xsd:enumeration value="getAvailableTime"/>
<xsd:enumeration value="saveServiceAppointmentAttendees"/>
<xsd:enumeration value="fetchAppointmentInfo"/>
<xsd:enumeration value="scheduleAppointment"/>
<xsd:enumeration value="getAppointmentDetails"/>
<xsd:enumeration value="getServiceAppointments"/>
<xsd:enumeration value="createApptPaymentLink"/>
<xsd:enumeration value="deleteKnowledgeArticles"/>
<xsd:enumeration value="submitKnowledgeArticleForTranslation"/>
<xsd:enumeration value="einsteinEPLitePredictionAction"/>
<xsd:enumeration value="cartToOrderAction"/>
<xsd:enumeration value="orderToCartAction"/>
<xsd:enumeration value="activateOrderAction"/>
<xsd:enumeration value="refreshActualsCalculation"/>
<xsd:enumeration value="cancelAppointment"/>
<xsd:enumeration value="recalculateForecast"/>
<xsd:enumeration value="getBenefitAndCalculateRebateAmount"/>
<xsd:enumeration value="upsertCustomRebatePayout"/>
<xsd:enumeration value="calculateRebateAmountAndUpsertPayout"/>
<xsd:enumeration value="processRebatesBatchCalculationJob"/>
<xsd:enumeration value="generateRebatePayoutPeriods"/>
<xsd:enumeration value="calculateAdvancedAccountForecast"/>
<xsd:enumeration value="processAccountForecasts"/>
<xsd:enumeration value="managedContentReleasePublish"/>
<xsd:enumeration value="editQuipDocument"/>
<xsd:enumeration value="attachQuipDocumentToRecord"/>
<xsd:enumeration value="createQuipDocument"/>
<xsd:enumeration value="createQuipFolder"/>
<xsd:enumeration value="addUsersToQuipDocument"/>
<xsd:enumeration value="removeUsersFromQuipDocument"/>
<xsd:enumeration value="copyQuipDocument"/>
<xsd:enumeration value="addMessageToQuipDocument"/>
<xsd:enumeration value="addQuipDocumentToFolder"/>
<xsd:enumeration value="removeQuipDocumentFromFolder"/>
<xsd:enumeration value="createQuipChat"/>
<xsd:enumeration value="addMessageToQuipChat"/>
<xsd:enumeration value="addUsersToQuipChat"/>
<xsd:enumeration value="removeUsersFromQuipChat"/>
<xsd:enumeration value="copyQuipContent"/>
<xsd:enumeration value="lockQuipDocument"/>
<xsd:enumeration value="lockQuipSection"/>
<xsd:enumeration value="quipLivePaste"/>
<xsd:enumeration value="exportQuipDocumentToPdf"/>
<xsd:enumeration value="priceCart"/>
<xsd:enumeration value="cartInitiateAsyncStep"/>
<xsd:enumeration value="cartCompleteAsyncStep"/>
<xsd:enumeration value="cancelCartAsyncOperation"/>
<xsd:enumeration value="createCart"/>
<xsd:enumeration value="addCartItem"/>
<xsd:enumeration value="getCartItems"/>
<xsd:enumeration value="getCartPromotions"/>
<xsd:enumeration value="deleteCart"/>
<xsd:enumeration value="cancelFulfillmentOrderItem"/>
<xsd:enumeration value="createFulfillmentOrder"/>
<xsd:enumeration value="createInvoiceFromFulfillmentOrder"/>
<xsd:enumeration value="createFulfillmentOrders"/>
<xsd:enumeration value="createOrderPaymentSummary"/>
<xsd:enumeration value="cancelOrderItemSummariesPreview"/>
<xsd:enumeration value="cancelOrderItemSummariesSubmit"/>
<xsd:enumeration value="createCreditMemoOrderSummary"/>
<xsd:enumeration value="ensureFundsOrderSummaryAsync"/>
<xsd:enumeration value="ensureRefundsOrderSummaryAsync"/>
<xsd:enumeration value="returnOrderItemSummariesPreview"/>
<xsd:enumeration value="returnOrderItemSummariesSubmit"/>
<xsd:enumeration value="createReturnOrder"/>
<xsd:enumeration value="createOrderSummary"/>
<xsd:enumeration value="adjustOrderItemSummariesPreview"/>
<xsd:enumeration value="adjustOrderItemSummariesSubmit"/>
<xsd:enumeration value="addOrderItemSummarySubmit"/>
<xsd:enumeration value="distributePickedQuantities"/>
<xsd:enumeration value="createOrderFromQuote"/>
<xsd:enumeration value="placeSalesTransaction"/>
<xsd:enumeration value="createOrUpdateAssetFromOrder"/>
<xsd:enumeration value="createBillingScheduleFromOrderItem"/>
<xsd:enumeration value="changeFinancePeriodStatus"/>
<xsd:enumeration value="applyPayment"/>
<xsd:enumeration value="unapplyPayment"/>
<xsd:enumeration value="paymentSale"/>
<xsd:enumeration value="automateRefund"/>
<xsd:enumeration value="createInvoiceFromOrder"/>
<xsd:enumeration value="createOrUpdateAssetFromOrderItem"/>
<xsd:enumeration value="createContract"/>
<xsd:enumeration value="ociTransferReservation"/>
<xsd:enumeration value="ociReleaseReservation"/>
<xsd:enumeration value="ociGetAvailability"/>
<xsd:enumeration value="ociFulfillReservation"/>
<xsd:enumeration value="ociCreateReservation"/>
<xsd:enumeration value="ociUpdateReservation"/>
<xsd:enumeration value="orderRoutingRankByAverageDistance"/>
<xsd:enumeration value="orderRoutingFindRoutesWithFewestSplits"/>
<xsd:enumeration value="orderRoutingFindRoutesWithFewestSplitsUsingOCI"/>
<xsd:enumeration value="holdFulfillmentOrderCapacity"/>
<xsd:enumeration value="releaseHeldFulfillmentOrderCapacity"/>
<xsd:enumeration value="confirmHeldFulfillmentOrderCapacity"/>
<xsd:enumeration value="getFulfillmentOrderCapacityValues"/>
<xsd:enumeration value="print"/>
<xsd:enumeration value="exportSurveyResponses"/>
<xsd:enumeration value="checkoutSessionAction"/>
<xsd:enumeration value="checkCartInventoryAction"/>
<xsd:enumeration value="calcCartTaxesAction"/>
<xsd:enumeration value="calcCartShipmentAction"/>
<xsd:enumeration value="calcCartPromotionsAction"/>
<xsd:enumeration value="sendSurveyInvitation"/>
<xsd:enumeration value="publishPardotContent"/>
<xsd:enumeration value="storeReplyRecommendationsFeedback"/>
<xsd:enumeration value="marketingEmail"/>
<xsd:enumeration value="updateCheckoutSessionStateAction"/>
<xsd:enumeration value="massUpdateAccountForecast"/>
<xsd:enumeration value="massUpdateSalesAgreement"/>
<xsd:enumeration value="buildWarrantyClaimContext"/>
<xsd:enumeration value="decisionTableAction"/>
<xsd:enumeration value="runDecisionMatrix"/>
<xsd:enumeration value="createFinancialRecords"/>
<xsd:enumeration value="createIncidentFromConversation"/>
<xsd:enumeration value="addWorkPlans"/>
<xsd:enumeration value="addWorkSteps"/>
<xsd:enumeration value="generateWorkPlans"/>
<xsd:enumeration value="deleteWorkPlans"/>
<xsd:enumeration value="pardotGetListx"/>
<xsd:enumeration value="pardotAddToListMembership"/>
<xsd:enumeration value="getTier"/>
<xsd:enumeration value="changeTier"/>
<xsd:enumeration value="changeAllTierOrNone"/>
<xsd:enumeration value="getPointsBalance"/>
<xsd:enumeration value="updateAcctMgrTarget"/>
<xsd:enumeration value="creditPoints"/>
<xsd:enumeration value="transferPoints"/>
<xsd:enumeration value="createSvcRequest"/>
<xsd:enumeration value="debitPoints"/>
<xsd:enumeration value="batchJobAction"/>
<xsd:enumeration value="dataProcessingEngineAction"/>
<xsd:enumeration value="adjustPointsAction"/>
<xsd:enumeration value="cancelRedemption"/>
<xsd:enumeration value="cancelAccrual"/>
<xsd:enumeration value="addRebateMemberList"/>
<xsd:enumeration value="saveRecommendationDecision"/>
<xsd:enumeration value="outboundMessage"/>
<xsd:enumeration value="internalTestAction"/>
<xsd:enumeration value="internalTestAsyncAction"/>
<xsd:enumeration value="internalTestConnectApiAction"/>
<xsd:enumeration value="internalTestVersionedCustomAction"/>
<xsd:enumeration value="extractDataFromDocument"/>
<xsd:enumeration value="createSite"/>
<xsd:enumeration value="internalTestCustomAction"/>
<xsd:enumeration value="getDialerSoftphonePathSuffix"/>
<xsd:enumeration value="performMultiLevelRollups"/>
<xsd:enumeration value="rebatesProcessCSV"/>
<xsd:enumeration value="processMemberBenefitAction"/>
<xsd:enumeration value="assignMemberTierBenefits"/>
<xsd:enumeration value="dynamicSendSurveyInvitation"/>
<xsd:enumeration value="getIntelligentAccountSettingsToken"/>
<xsd:enumeration value="issueVoucher"/>
<xsd:enumeration value="setCheckoutDeliveryMethod"/>
<xsd:enumeration value="refreshDecisionTable"/>
<xsd:enumeration value="replaceAsset"/>
<xsd:enumeration value="relocateAsset"/>
<xsd:enumeration value="evaluationFlow"/>
<xsd:enumeration value="stepInteractive"/>
<xsd:enumeration value="stepBackground"/>
<xsd:enumeration value="stepMuleSoft"/>
<xsd:enumeration value="managedContentRoleStepInteractive"/>
<xsd:enumeration value="managedContentVariantSetLockStepBackground"/>
<xsd:enumeration value="managedContentVariantSetReadyStepBackground"/>
<xsd:enumeration value="managedContentVariantAutoPublishStepBackground"/>
<xsd:enumeration value="managedContentVariantAutoUnpublishStepBackground"/>
<xsd:enumeration value="stepApproval"/>
<xsd:enumeration value="generateKnowledgeLogData"/>
<xsd:enumeration value="submitFailedRecordsBatchJob"/>
<xsd:enumeration value="getEligibleProgramRebateTypes"/>
<xsd:enumeration value="returnReturnOrderItems"/>
<xsd:enumeration value="slackPostMessage"/>
<xsd:enumeration value="slackUpdateMessage"/>
<xsd:enumeration value="slackPinMessage"/>
<xsd:enumeration value="slackCreateChannel"/>
<xsd:enumeration value="slackInviteUsersToChannel"/>
<xsd:enumeration value="slackUserInWorkspace"/>
<xsd:enumeration value="slackCheckUsersAreConnectedToSlack"/>
<xsd:enumeration value="slackArchiveChannel"/>
<xsd:enumeration value="slackGetConversationInfo"/>
<xsd:enumeration value="slackAgentCreateCanvas"/>
<xsd:enumeration value="slackAgentUpdateCanvas"/>
<xsd:enumeration value="slackAgentSearch"/>
<xsd:enumeration value="slackAgentGetUser"/>
<xsd:enumeration value="slackAgentSendDirectMessage"/>
<xsd:enumeration value="slackAgentSummarizeChannel"/>
<xsd:enumeration value="slackAgentDynamic"/>
<xsd:enumeration value="slackAgentChannelExpertSearch"/>
<xsd:enumeration value="getLoyaltyPromotionBasedOnSalesforceCDP"/>
<xsd:enumeration value="transferMemberPointsToGroups"/>
<xsd:enumeration value="getLoyaltyPromotion"/>
<xsd:enumeration value="createServiceDocument"/>
<xsd:enumeration value="createArticleRecommendations"/>
<xsd:enumeration value="discoveryPredict"/>
<xsd:enumeration value="processProgramRebateTypeProducts"/>
<xsd:enumeration value="fetchCaseClassificationRecommendations"/>
<xsd:enumeration value="applyCaseClassificationRecommendations"/>
<xsd:enumeration value="updateProgressForCumulativePromotionUsage"/>
<xsd:enumeration value="updateAdvancedAccountForecastSetPartner"/>
<xsd:enumeration value="swarmingCollaborationToolSettings"/>
<xsd:enumeration value="getArticleSmartLinkUrl"/>
<xsd:enumeration value="performSurveySentimentAnalysis"/>
<xsd:enumeration value="pardotSlackCompletionActionNotification"/>
<xsd:enumeration value="createClosePlan"/>
<xsd:enumeration value="getProductPricing"/>
<xsd:enumeration value="findPastCollaborators"/>
<xsd:enumeration value="getDataRelatedToOpportunity"/>
<xsd:enumeration value="calculateProjectedRebateAmount"/>
<xsd:enumeration value="runProgramProcessForTransactionJournal"/>
<xsd:enumeration value="goalAchievedAction"/>
<xsd:enumeration value="buildIdentityVerification"/>
<xsd:enumeration value="getVerificationData"/>
<xsd:enumeration value="sendNotification"/>
<xsd:enumeration value="uploadBlockchainData"/>
<xsd:enumeration value="saveMemberVerificationSteps"/>
<xsd:enumeration value="limitRepetitions"/>
<xsd:enumeration value="slackSendMessageToLaunchFlow"/>
<xsd:enumeration value="manageRecurringSchedules"/>
<xsd:enumeration value="importRecordsFromCsvFile"/>
<xsd:enumeration value="authorizePayment"/>
<xsd:enumeration value="getMemberActiveSegments"/>
<xsd:enumeration value="getAvailableSwarmObject"/>
<xsd:enumeration value="runExpressionSet"/>
<xsd:enumeration value="mergeLoyaltyProgramMembership"/>
<xsd:enumeration value="unmergeLoyaltyProgramMembership"/>
<xsd:enumeration value="massUpdateAdvAccountForecast"/>
<xsd:enumeration value="runProgramProcess"/>
<xsd:enumeration value="getAssessmentResponseSummary"/>
<xsd:enumeration value="industriesSendApexAsyncRequest"/>
<xsd:enumeration value="slackJoinChannel"/>
<xsd:enumeration value="createInvoiceFromChangeOrders"/>
<xsd:enumeration value="generateInboxSchedulingLink"/>
<xsd:enumeration value="generateInboxMeetingTimes"/>
<xsd:enumeration value="confirmInboxMeetingTime"/>
<xsd:enumeration value="sendEmailMessage"/>
<xsd:enumeration value="goToCadenceStep"/>
<xsd:enumeration value="createBenefitDisbursement"/>
<xsd:enumeration value="createCareProgramEnrolleeWorkOrderStep"/>
<xsd:enumeration value="generateTransactionJournals"/>
<xsd:enumeration value="cdpRefreshDataStream"/>
<xsd:enumeration value="getDataLakeObject"/>
<xsd:enumeration value="getDataModelObjectSuggestions"/>
<xsd:enumeration value="generateDataMappings"/>
<xsd:enumeration value="getDataModelObject"/>
<xsd:enumeration value="getDataModelObjectsPaginated"/>
<xsd:enumeration value="cdpCreateSegmentFilter"/>
<xsd:enumeration value="dataKitDeployComponentAction"/>
<xsd:enumeration value="dataKitGetComponentAction"/>
<xsd:enumeration value="generateMemberReferralCode"/>
<xsd:enumeration value="cdpPublishSegment"/>
<xsd:enumeration value="cdpValidateSegmentMember"/>
<xsd:enumeration value="fetchSegmentsSchedule"/>
<xsd:enumeration value="deleteCdpIdentityResolution"/>
<xsd:enumeration value="cdpCreateIdentityResolution"/>
<xsd:enumeration value="cdpUpdateIdentityResolution"/>
<xsd:enumeration value="cdpRtdgStatus"/>
<xsd:enumeration value="cdpRtGetIdMap"/>
<xsd:enumeration value="cdpIdentityResolutionRunNow"/>
<xsd:enumeration value="getSegmentMemberAbsenceContainers"/>
<xsd:enumeration value="industriesSendExtAsyncRequest"/>
<xsd:enumeration value="getDataCategoryDetails"/>
<xsd:enumeration value="getDataCategoryGroups"/>
<xsd:enumeration value="searchKnowledgeArticles"/>
<xsd:enumeration value="knowledgeSearch"/>
<xsd:enumeration value="streamKnowledgeSearch"/>
<xsd:enumeration value="answerQuestionsWithSalesforceDocumentation"/>
<xsd:enumeration value="cdpPublishCalculatedInsight"/>
<xsd:enumeration value="getInsight"/>
<xsd:enumeration value="getInsightsList"/>
<xsd:enumeration value="deleteInsight"/>
<xsd:enumeration value="updateInsight"/>
<xsd:enumeration value="cdpRunBatchTransform"/>
<xsd:enumeration value="cdpCancelDataTransform"/>
<xsd:enumeration value="cdpCreateDataTransforms"/>
<xsd:enumeration value="cdpListDataTransforms"/>
<xsd:enumeration value="cdpValidateDataTransform"/>
<xsd:enumeration value="cdpRunDataTransform"/>
<xsd:enumeration value="cdpRetryDataTransform"/>
<xsd:enumeration value="cdpGetDataTransform"/>
<xsd:enumeration value="cdpRefreshDataTransformStatus"/>
<xsd:enumeration value="cdpDeleteDataTransform"/>
<xsd:enumeration value="cdpGetDataTransformSchedule"/>
<xsd:enumeration value="cdpMlPrediction"/>
<xsd:enumeration value="cdpGetMlModelMetrics"/>
<xsd:enumeration value="cdpGetMlModelAlerts"/>
<xsd:enumeration value="cdpGetDataProfiles"/>
<xsd:enumeration value="cdpGetMlModelSuggestions"/>
<xsd:enumeration value="einsteinRagDetectLanguage"/>
<xsd:enumeration value="transformQueryForCase"/>
<xsd:enumeration value="transformQueryForEmail"/>
<xsd:enumeration value="transformQueryForConversation"/>
<xsd:enumeration value="getEinsteinRetrieverResults"/>
<xsd:enumeration value="cdpGetDataGraph"/>
<xsd:enumeration value="cdpGetDataGraphByLookup"/>
<xsd:enumeration value="cdpGetDataGraphMetadata"/>
<xsd:enumeration value="cdpTriggerModelPredJob"/>
<xsd:enumeration value="getTranscriptForConversation"/>
<xsd:enumeration value="scheduleHomeVisit"/>
<xsd:enumeration value="scheduleRecurringHomeVisit"/>
<xsd:enumeration value="rescheduleRecurringHomeVisits"/>
<xsd:enumeration value="createQuoteForHomeVisits"/>
<xsd:enumeration value="generateAssessmentEnvelopeSignature"/>
<xsd:enumeration value="sendChannelMessage"/>
<xsd:enumeration value="createInvRsvForCart"/>
<xsd:enumeration value="deleteInvRsvForCart"/>
<xsd:enumeration value="initiateTextExtraction"/>
<xsd:enumeration value="fetchActiveOcrTemplates"/>
<xsd:enumeration value="fetchExtractedText"/>
<xsd:enumeration value="createMaterialLineForSalesItem"/>
<xsd:enumeration value="generateDisambiguationLogData"/>
<xsd:enumeration value="cdpRunIdentityResolution"/>
<xsd:enumeration value="handleResourceAbsence"/>
<xsd:enumeration value="fetchRebateClaimDetails"/>
<xsd:enumeration value="transformMfgProgramForecasts"/>
<xsd:enumeration value="getNewProductPricingInfo"/>
<xsd:enumeration value="calcPriceProtectPayoutAmt"/>
<xsd:enumeration value="processGiftEntries"/>
<xsd:enumeration value="saveCustomFieldsInGiftEntry"/>
<xsd:enumeration value="processGiftCommitment"/>
<xsd:enumeration value="pauseGiftCommitmentSchedule"/>
<xsd:enumeration value="resumeGiftCommitmentSchedule"/>
<xsd:enumeration value="closeGiftCommitment"/>
<xsd:enumeration value="syncAccountAndContactPointAddr"/>
<xsd:enumeration value="manageCustomGiftCmtSchds"/>
<xsd:enumeration value="manageGiftDefaultDesignations"/>
<xsd:enumeration value="manageRcrGiftCmtSchd"/>
<xsd:enumeration value="updateProcessedGiftEntries"/>
<xsd:enumeration value="manageFundraisingDefinitions"/>
<xsd:enumeration value="reviewUpdateVolunteerStatuses"/>
<xsd:enumeration value="updateVolunteerStatuses"/>
<xsd:enumeration value="assignEnablementProgram"/>
<xsd:enumeration value="inviteToReorderPortal"/>
<xsd:enumeration value="runRecordAggrBatchProcDef"/>
<xsd:enumeration value="sendSmsMessage"/>
<xsd:enumeration value="creaContactsFromGrpCensMembers"/>
<xsd:enumeration value="creaPersAccountsFromGrpCensMbr"/>
<xsd:enumeration value="creaUsersFromGrpCensusMembers"/>
<xsd:enumeration value="enrollMembers"/>
<xsd:enumeration value="createProducerCommissions"/>
<xsd:enumeration value="findInsurancePolicy"/>
<xsd:enumeration value="initiateAmendQuantity"/>
<xsd:enumeration value="initiateAmendment"/>
<xsd:enumeration value="initiateTransfer"/>
<xsd:enumeration value="initiateRenewal"/>
<xsd:enumeration value="initiateCancellation"/>
<xsd:enumeration value="getRenewableAssetsSummary"/>
<xsd:enumeration value="manageGiftTrxnDesignations"/>
<xsd:enumeration value="processReceivedDocument"/>
<xsd:enumeration value="getEffAccountsForStoreUser"/>
<xsd:enumeration value="getProductRecommendations"/>
<xsd:enumeration value="b2bD2cGetOrderSummaries"/>
<xsd:enumeration value="getRecentOrders"/>
<xsd:enumeration value="getB2cProductRecommendations"/>
<xsd:enumeration value="getB2cOrderDetails"/>
<xsd:enumeration value="getB2cUserAccessToken"/>
<xsd:enumeration value="addItemToBasket"/>
<xsd:enumeration value="viewCart"/>
<xsd:enumeration value="editCart"/>
<xsd:enumeration value="generateOrderSummaryUrl"/>
<xsd:enumeration value="createBenefitDisbursementForServiceAppointment"/>
<xsd:enumeration value="getAssessments"/>
<xsd:enumeration value="getAcademicTerm"/>
<xsd:enumeration value="getIntrctnSumAndCarePlans"/>
<xsd:enumeration value="getCalcInsightsData"/>
<xsd:enumeration value="renewInsurancePolicy"/>
<xsd:enumeration value="renewInsurancePolicies"/>
<xsd:enumeration value="enrollLearner"/>
<xsd:enumeration value="executeExprSetWithContext"/>
<xsd:enumeration value="getBatchJobIds"/>
<xsd:enumeration value="getRestrictionsAsgnToStudent"/>
<xsd:enumeration value="buildContext"/>
<xsd:enumeration value="createClmContract"/>
<xsd:enumeration value="createReport"/>
<xsd:enumeration value="checkInContractDocumentVersion"/>
<xsd:enumeration value="performContractAction"/>
<xsd:enumeration value="sendContractForESignature"/>
<xsd:enumeration value="unlockContractDocumentVersion"/>
<xsd:enumeration value="getCntntDocDtlForCntrDocVer"/>
<xsd:enumeration value="createContractDocumentVersion"/>
<xsd:enumeration value="persistContextData"/>
<xsd:enumeration value="createReferral"/>
<xsd:enumeration value="createChatSession"/>
<xsd:enumeration value="addOrderToCart"/>
<xsd:enumeration value="generateUserInputs"/>
<xsd:enumeration value="rateProducts"/>
<xsd:enumeration value="getInsuranceQuoteDetails"/>
<xsd:enumeration value="getOrgCurrencyDetails"/>
<xsd:enumeration value="repriceInsuranceProduct"/>
<xsd:enumeration value="createInsuranceQuote"/>
<xsd:enumeration value="updateCareGapStatus"/>
<xsd:enumeration value="sendConversationMessages"/>
<xsd:enumeration value="initiateNaturalLangProcessing"/>
<xsd:enumeration value="getRecordDetails"/>
<xsd:enumeration value="getConversationTranscripts"/>
<xsd:enumeration value="fetchBoostBuryRuleRecommendation"/>
<xsd:enumeration value="createSearchBoostBuryRule"/>
<xsd:enumeration value="captureUserFeedback"/>
<xsd:enumeration value="previewCartToExchangeOrder"/>
<xsd:enumeration value="submitCartToExchangeOrder"/>
<xsd:enumeration value="dispatchReminders"/>
<xsd:enumeration value="computeCleanEnergyApplnBen"/>
<xsd:enumeration value="createContactInBillingSystem"/>
<xsd:enumeration value="createBillAcctInBillSystem"/>
<xsd:enumeration value="updateBillAcctInBillSystem"/>
<xsd:enumeration value="getBillsOfBillingAccount"/>
<xsd:enumeration value="getBillDetails"/>
<xsd:enumeration value="createContractsInBillingSystem"/>
<xsd:enumeration value="getMeterReadingFromBillingSys"/>
<xsd:enumeration value="updateContractInBillingSystem"/>
<xsd:enumeration value="startService"/>
<xsd:enumeration value="submitMeterReads"/>
<xsd:enumeration value="identifyRecordByName"/>
<xsd:enumeration value="processReferralEvent"/>
<xsd:enumeration value="enrollAdvocateB2bReferralProm"/>
<xsd:enumeration value="processB2bReferralEvent"/>
<xsd:enumeration value="submitOrder"/>
<xsd:enumeration value="dataCloudIngestionApi"/>
<xsd:enumeration value="getPaynowWebstoreId"/>
<xsd:enumeration value="queryRecords"/>
<xsd:enumeration value="queryRecordsWithAggregate"/>
<xsd:enumeration value="searchAgent"/>
<xsd:enumeration value="registerGuestBuyer"/>
<xsd:enumeration value="identifyObject"/>
<xsd:enumeration value="scheduleGroupVisits"/>
<xsd:enumeration value="createSubscriptionRecords"/>
<xsd:enumeration value="generatePromptResponse"/>
<xsd:enumeration value="generatePromptResponseBatch"/>
<xsd:enumeration value="getRelatedList"/>
<xsd:enumeration value="getSimilarRecords"/>
<xsd:enumeration value="einsteinGenerateMessages"/>
<xsd:enumeration value="draftOrReviseEmail"/>
<xsd:enumeration value="sendMeetingRequest"/>
<xsd:enumeration value="reviewMyDay"/>
<xsd:enumeration value="getDraftOrReviseEmailPrompt"/>
<xsd:enumeration value="summarizeRecord"/>
<xsd:enumeration value="einsteinCopilotUpdateRecord"/>
<xsd:enumeration value="runSalesforcePricing"/>
<xsd:enumeration value="processFirstPaymentBilling"/>
<xsd:enumeration value="runSalesforceHeadlessPricing"/>
<xsd:enumeration value="dstrEnergyAttrCertCredits"/>
<xsd:enumeration value="getRecordFieldsAndValues"/>
<xsd:enumeration value="createCommercePromotions"/>
<xsd:enumeration value="createIntegrationPlan"/>
<xsd:enumeration value="runIntegrationPlan"/>
<xsd:enumeration value="exploreConversation"/>
<xsd:enumeration value="draftServiceEmail"/>
<xsd:enumeration value="getActivitySummary"/>
<xsd:enumeration value="generateResearchStudyBlocks"/>
<xsd:enumeration value="processCriteriaMatchingResp"/>
<xsd:enumeration value="getForecastGuidance"/>
<xsd:enumeration value="getForecastContext"/>
<xsd:enumeration value="getForecastOpportunities"/>
<xsd:enumeration value="getRecPrioData"/>
<xsd:enumeration value="sendWhatsAppMessage"/>
<xsd:enumeration value="lockRecord"/>
<xsd:enumeration value="postDraftInvoiceBatchRun"/>
<xsd:enumeration value="assignCndtToResearchStudyGroup"/>
<xsd:enumeration value="postDraftInvoice"/>
<xsd:enumeration value="getConvTscpForRecord"/>
<xsd:enumeration value="recoverBillingSchedules"/>
<xsd:enumeration value="checkOutContractDocVersion"/>
<xsd:enumeration value="getContractDocumentVersions"/>
<xsd:enumeration value="updateClmContracts"/>
<xsd:enumeration value="draftAGiftProposal"/>
<xsd:enumeration value="processDataUsingGenAi"/>
<xsd:enumeration value="transformNlpActionResult"/>
<xsd:enumeration value="getSalesAgreementDetails"/>
<xsd:enumeration value="createConsent"/>
<xsd:enumeration value="exportExternalRecordShare"/>
<xsd:enumeration value="checkServiceCatalogItemEligibility"/>
<xsd:enumeration value="createCatalogItemRequest"/>
<xsd:enumeration value="answerQuestionWithReports"/>
<xsd:enumeration value="generateSdm"/>
<xsd:enumeration value="topUsedDatasets"/>
<xsd:enumeration value="createEngagementsDetailsRep"/>
<xsd:enumeration value="createBillingSchedulesFromBillingTransaction"/>
<xsd:enumeration value="createBillingSchedulesFromTrxn"/>
<xsd:enumeration value="scheduleHomeVisitsManually"/>
<xsd:enumeration value="analyticsSendDigestAsSlackMsg"/>
<xsd:enumeration value="createUpdtPromUseAcruPromTmpl"/>
<xsd:enumeration value="generateLoyaltyPromotionEmail"/>
<xsd:enumeration value="getEligibleLoyaltyPromotions"/>
<xsd:enumeration value="getExpiringPointsWithDate"/>
<xsd:enumeration value="getPointsForNextTier"/>
<xsd:enumeration value="getResourcesForMnlScheduling"/>
<xsd:enumeration value="generateAnalyticsAssetsContent"/>
<xsd:enumeration value="quoteToSA"/>
<xsd:enumeration value="convertRecord"/>
<xsd:enumeration value="getEngagements"/>
<xsd:enumeration value="createCaseForOrderCheckbook"/>
<xsd:enumeration value="getFinclAccountsForAnAcct"/>
<xsd:enumeration value="getFeeTrxnFromFinclAcct"/>
<xsd:enumeration value="createCaseForFeeReversal"/>
<xsd:enumeration value="createCaseForManageCardSettings"/>
<xsd:enumeration value="createCaseForStopCheckPayment"/>
<xsd:enumeration value="createCaseForTravelNotification"/>
<xsd:enumeration value="getCardSettings"/>
<xsd:enumeration value="createCaseForTransferFunds"/>
<xsd:enumeration value="api"/>
<xsd:enumeration value="getChannelTypes"/>
<xsd:enumeration value="getMetrics"/>
<xsd:enumeration value="getCampaignObjectives"/>
<xsd:enumeration value="getLowPerformingAds"/>
<xsd:enumeration value="getBalancesFromFinancialAccounts"/>
<xsd:enumeration value="getFinancialTransactions"/>
<xsd:enumeration value="getCardDetailsForAccount"/>
<xsd:enumeration value="createCaseToBlockCard"/>
<xsd:enumeration value="createVisitForContextRecord"/>
<xsd:enumeration value="getFinancialAccountAddresses"/>
<xsd:enumeration value="createCaseForFinclAcctAddrUpdt"/>
<xsd:enumeration value="getAndExplainObjectPermissions"/>
<xsd:enumeration value="serializePreWorkBriefRecords"/>
<xsd:enumeration value="extractHistoricalData"/>
<xsd:enumeration value="generateBrief"/>
<xsd:enumeration value="saveBrief"/>
<xsd:enumeration value="generateCampaignFromBrief"/>
<xsd:enumeration value="saveCampaign"/>
<xsd:enumeration value="summarizeCampaign"/>
<xsd:enumeration value="researchRecord"/>
<xsd:enumeration value="reviewBuyingCommittee"/>
<xsd:enumeration value="getCaseInfoToSummarize"/>
<xsd:enumeration value="getUsersFromEmailAddresses"/>
<xsd:enumeration value="discoverySearchAction"/>
<xsd:enumeration value="b2cProductSearchAction"/>
<xsd:enumeration value="b2cProductDetailsAction"/>
<xsd:enumeration value="getB2cOrderConfirmationDetails"/>
<xsd:enumeration value="einsteinDecidePath"/>
<xsd:enumeration value="generateCustomReportType"/>
<xsd:enumeration value="topUsedObjectsInReports"/>
<xsd:enumeration value="generateSdmForReportingObjects"/>
<xsd:enumeration value="generateMetricsForTopAggs"/>
<xsd:enumeration value="reportsToTuaViz"/>
<xsd:enumeration value="associateRecordsWithActivity"/>
<xsd:enumeration value="getAcctOpptyFromEmailAddr"/>
<xsd:enumeration value="trgrOnOrderPlacement"/>
<xsd:enumeration value="trgrOnWebCartAbandoned"/>
<xsd:enumeration value="processWebStoreUserRgstr"/>
<xsd:enumeration value="trgrOnSmsSubscription"/>
<xsd:enumeration value="trgrOnWhatsAppSubscription"/>
<xsd:enumeration value="trgrOnEmailSubscription"/>
<xsd:enumeration value="trgrOnEmailOpenEngagement"/>
<xsd:enumeration value="trgrOnEmailLinkClickEngagement"/>
<xsd:enumeration value="trgrOnEmailBounceEngagement"/>
<xsd:enumeration value="trgrOnSmsLinkClickEngagement"/>
<xsd:enumeration value="trgrOnSmsDeliveryFailureEngagement"/>
<xsd:enumeration value="trgrOnSmsResponseEngagement"/>
<xsd:enumeration value="trgrOnWhatsAppResponseEngmt"/>
<xsd:enumeration value="trgrOnWhatsAppReadEngagement"/>
<xsd:enumeration value="trgrOnWhatsAppDeliveredEngagement"/>
<xsd:enumeration value="trgrOnWhatsAppLinkClickEngmt"/>
<xsd:enumeration value="trgrOnWhatsAppDlvrFailureEngmt"/>
<xsd:enumeration value="explainFormula"/>
<xsd:enumeration value="modifyFormula"/>
<xsd:enumeration value="validateFormula"/>
<xsd:enumeration value="publishActionableOrchSrcEvent"/>
<xsd:enumeration value="createApptListFilter"/>
<xsd:enumeration value="summarizeSchedulingIssues"/>
<xsd:enumeration value="getAppointmentsToFillGaps"/>
<xsd:enumeration value="getAppointmentsByCriteria"/>
<xsd:enumeration value="rebookNotifyForFieldService"/>
<xsd:enumeration value="assignApptForServiceResourceForFieldService"/>
<xsd:enumeration value="scheduleServiceAppointment"/>
<xsd:enumeration value="createEngagementTopic"/>
<xsd:enumeration value="getEngagementTopics"/>
<xsd:enumeration value="computeProducerSplits"/>
<xsd:enumeration value="generateInvoiceDocuments"/>
<xsd:enumeration value="forwardToBotOrAgent"/>
<xsd:enumeration value="lookUpOrderSummary"/>
<xsd:enumeration value="formatInsightsForDisplay"/>
<xsd:enumeration value="contextDataProvider"/>
<xsd:enumeration value="prepareMeeting"/>
<xsd:enumeration value="getAssetParticipantDetails"/>
<xsd:enumeration value="recallApprovalSubmission"/>
<xsd:enumeration value="reassignApprovalWorkItem"/>
<xsd:enumeration value="reviewApprovalWorkItem"/>
<xsd:enumeration value="overrideApprovalWorkItem"/>
<xsd:enumeration value="cancelApprovalSubmission"/>
<xsd:enumeration value="getCommercePromotionTemplates"/>
<xsd:enumeration value="recommendFields"/>
<xsd:enumeration value="identifyObjectByName"/>
<xsd:enumeration value="getContcLeadsFromEmailAddr"/>
<xsd:enumeration value="trgrOnFormSubmission"/>
<xsd:enumeration value="trgrOnPaymentTransaction"/>
<xsd:enumeration value="invokeRatingService"/>
<xsd:enumeration value="recordTaxTransaction"/>
<xsd:enumeration value="recordTaxReversal"/>
<xsd:enumeration value="applyCredit"/>
<xsd:enumeration value="unapplyCredit"/>
<xsd:enumeration value="createFieldGnrnPromptTmplResp"/>
<xsd:enumeration value="validateTimesheet"/>
<xsd:enumeration value="applyUserDefinedLabel"/>
<xsd:enumeration value="createAToDo"/>
<xsd:enumeration value="createLabel"/>
<xsd:enumeration value="logACall"/>
<xsd:enumeration value="recommendComponents"/>
<xsd:enumeration value="draftCaseResponse"/>
<xsd:enumeration value="findSimilarCases"/>
<xsd:enumeration value="itsmRecordRltdDataGenerator"/>
<xsd:enumeration value="itsmRelatedRecordsAction"/>
<xsd:enumeration value="itsmMltRcdRltdDataGenerator"/>
<xsd:enumeration value="summarizeEngagement"/>
<xsd:enumeration value="getProductDetails"/>
<xsd:enumeration value="findProducts"/>
<xsd:enumeration value="getProducts"/>
<xsd:enumeration value="identifySObjectFieldProperties"/>
<xsd:enumeration value="configureAgents"/>
<xsd:enumeration value="scheduleEmail"/>
<xsd:enumeration value="getAppointmentBookingSlots"/>
<xsd:enumeration value="convertTimeZone"/>
<xsd:enumeration value="cdpListAvailableConnectors"/>
<xsd:enumeration value="getAndExplainUserPermissions"/>
<xsd:enumeration value="computeConsumption"/>
<xsd:enumeration value="createConsumptionAlert"/>
<xsd:enumeration value="replenishInventoryUsingPolicy"/>
<xsd:enumeration value="issueInsurancePolicy"/>
<xsd:enumeration value="getCommerceStorefrontContext"/>
<xsd:enumeration value="getRecordSummarizationPrompt"/>
<xsd:enumeration value="findSimilarInteractions"/>
<xsd:enumeration value="summarizeProductReviews"/>
<xsd:enumeration value="getActiveApplicationReviewerIds"/>
<xsd:enumeration value="dataModelSMEGenerateRequirementSection"/>
<xsd:enumeration value="dataModelSMEGenerateDesignSection"/>
<xsd:enumeration value="dataModelSMEGenerateBacklogSection"/>
<xsd:enumeration value="dataModelSMECreateCustomMetadata"/>
<xsd:enumeration value="getAgentContext"/>
<xsd:enumeration value="customAppSMEGenerateDesignSection"/>
<xsd:enumeration value="customAppSMEGenerateBacklogSection"/>
<xsd:enumeration value="customAppSMEExecutePlan"/>
<xsd:enumeration value="submitSalesTransaction"/>
<xsd:enumeration value="convertProspect"/>
<xsd:enumeration value="migrateConnectedApp"/>
<xsd:enumeration value="summarizeConnectedApp"/>
<xsd:enumeration value="getUserDataFromJsonString"/>
<xsd:enumeration value="evalCmplValidationProcedure"/>
<xsd:enumeration value="generateUserData"/>
<xsd:enumeration value="processConsumptionOverages"/>
<xsd:enumeration value="generateMetricInsights"/>
<xsd:enumeration value="refineSemanticSubMetric"/>
<xsd:enumeration value="analyzeSemanticData"/>
<xsd:enumeration value="summarizeDashboard"/>
<xsd:enumeration value="serializeHierarchicalContextData"/>
<xsd:enumeration value="getContextData"/>
<xsd:enumeration value="qualifyProspects"/>
<xsd:enumeration value="enrichWithLeadData"/>
<xsd:enumeration value="addNotesAndAssociateTopics"/>
<xsd:enumeration value="generateAiAgentResponse"/>
<xsd:enumeration value="createDataAlert"/>
<xsd:enumeration value="freezeSalesTransaction"/>
<xsd:enumeration value="invokeRule"/>
<xsd:enumeration value="endorseInsurancePolicy"/>
<xsd:enumeration value="savePaymentConfig"/>
<xsd:enumeration value="unfreezeSalesTransaction"/>
<xsd:enumeration value="identifyFieldByName"/>
<xsd:enumeration value="getPersonalizationDecisions"/>
<xsd:enumeration value="draftPersnlRecommender"/>
<xsd:enumeration value="cancelInsurancePolicy"/>
<xsd:enumeration value="getInsurancePolicy"/>
<xsd:enumeration value="createInsuranceClaim"/>
<xsd:enumeration value="queryContextTags"/>
<xsd:enumeration value="updateContextAttributes"/>
<xsd:enumeration value="deleteContextCache"/>
<xsd:enumeration value="getRecordAccessOfUser"/>
<xsd:enumeration value="getPointOfNoReturnDetails"/>
<xsd:enumeration value="rpa"/>
<xsd:enumeration value="scheduleSvcApptActnblEvntOrch"/>
<xsd:enumeration value="trgrOnVoucherStsChgOtbdEngmt"/>
<xsd:enumeration value="getGrndDataServiceRepliesEmail"/>
<xsd:enumeration value="retrieveServicePlanInfo"/>
<xsd:enumeration value="getPlanDataEnhanced"/>
<xsd:enumeration value="createOrderServiceAccount"/>
<xsd:enumeration value="refreshUsageEntitlementBucket"/>
<xsd:enumeration value="getLeaveBalance"/>
<xsd:enumeration value="executeMulesoftCallout"/>
<xsd:enumeration value="checkProductEligibility"/>
<xsd:enumeration value="checkSvcPrcActionEligibility"/>
<xsd:enumeration value="getGroupCensusMembers"/>
<xsd:enumeration value="getGroupCensusMembersAndPlans"/>
<xsd:enumeration value="validateGroupCensusMembers"/>
<xsd:enumeration value="validateGrpCensusMembersPlans"/>
<xsd:enumeration value="saveGroupCensusMembersData"/>
<xsd:enumeration value="saveGrpCensusMbrPlansData"/>
<xsd:enumeration value="createServiceRequestCase"/>
<xsd:enumeration value="convertAttributesToJson"/>
<xsd:enumeration value="invokeSummaryCreationService"/>
<xsd:enumeration value="identifyUserPermissionsByName"/>
<xsd:enumeration value="getAgentConvTscp"/>
<xsd:enumeration value="parseConvoAnalysis"/>
<xsd:enumeration value="getSvcProcessAttrData"/>
<xsd:enumeration value="convertDateToDateTime"/>
<xsd:enumeration value="createBulkRecords"/>
<xsd:enumeration value="convertDateTimeToDate"/>
<xsd:enumeration value="enhanceProductDescription"/>
<xsd:enumeration value="flexipageRefineRequirements"/>
<xsd:enumeration value="flexipageRefineDesign"/>
<xsd:enumeration value="flexipageRefinePlan"/>
<xsd:enumeration value="flexipageExecutePlan"/>
<xsd:enumeration value="createUpdatePromUseSpendXTmpl"/>
<xsd:enumeration value="createUpdatePricingPromotion"/>
<xsd:enumeration value="addUpdateLimitsInPricingProm"/>
<xsd:enumeration value="createUpdatePromUseBuyXTmpl"/>
<xsd:enumeration value="aslmHeadlessPricing"/>
<xsd:enumeration value="raiseFlag"/>
<xsd:enumeration value="addRecentOrderToCart"/>
<xsd:enumeration value="generateVerificationCode"/>
<xsd:enumeration value="verifyCustomerCode"/>
<xsd:enumeration value="siteSetupRefineRequirements"/>
<xsd:enumeration value="siteSetupRefineDesign"/>
<xsd:enumeration value="siteSetupRefinePlan"/>
<xsd:enumeration value="siteSetupExecutePlan"/>
<xsd:enumeration value="managedContentSetupRefineRequirements"/>
<xsd:enumeration value="managedContentSetupRefineDesign"/>
<xsd:enumeration value="managedContentSetupRefinePlan"/>
<xsd:enumeration value="managedContentSetupExecutePlan"/>
<xsd:enumeration value="generatePromptRequirementSection"/>
<xsd:enumeration value="generatePromptDesignSection"/>
<xsd:enumeration value="generatePromptBacklogSection"/>
<xsd:enumeration value="generatePromptMetadata"/>
<xsd:enumeration value="userAccessSMERefineUserAccessRequirement"/>
<xsd:enumeration value="userAccessSMERefineUserAccessDesign"/>
<xsd:enumeration value="userAccessSMERefineUserAccessBacklog"/>
<xsd:enumeration value="userAccessSMECreateUserAccessMetadata"/>
<xsd:enumeration value="createMediaProposal"/>
<xsd:enumeration value="verifyStoreAccess"/>
<xsd:enumeration value="getMonthlyUtilityConsumption"/>
<xsd:enumeration value="slackUnarchiveChannel"/>
<xsd:enumeration value="customAppRefineRequirements"/>
<xsd:enumeration value="getCatalogs"/>
<xsd:enumeration value="getCatalogDetails"/>
<xsd:enumeration value="getCategories"/>
<xsd:enumeration value="getCategoryDetails"/>
<xsd:enumeration value="executeQualificationProcedure"/>
<xsd:enumeration value="searchPrdctWithGuidedSelection"/>
<xsd:enumeration value="getMultipleProductDetails"/>
<xsd:enumeration value="getEnablementPrograms"/>
<xsd:enumeration value="getDirectDepositDetails"/>
<xsd:enumeration value="riskAssessmentRecords"/>
<xsd:enumeration value="getMediaProductsBasedOnAdTarget"/>
<xsd:enumeration value="getMemberBenefits"/>
<xsd:enumeration value="adjustPartnerUnsoldInventory"/>
<xsd:enumeration value="getSwarmTypeSlackAccessDetails"/>
<xsd:enumeration value="createSwarmSlackChannel"/>
<xsd:enumeration value="createSwarmSlackThread"/>
<xsd:enumeration value="slackCreateSalesforceChannel"/>
<xsd:enumeration value="getSearchConfigurationMetadata"/>
<xsd:enumeration value="trgrOnCustomEvent"/>
<xsd:enumeration value="getConversationTranscript"/>
<xsd:enumeration value="invokeGenericFhir"/>
<xsd:enumeration value="buildProdTerrDtlAvlAction"/>
<xsd:enumeration value="apexRest"/>
<xsd:enumeration value="getObjectRelationshipUserData"/>
<xsd:enumeration value="executeIntegrationProcedure"/>
<xsd:enumeration value="adjustPartnerInvShipAndDebit"/>
<xsd:enumeration value="assignTargetToSdr"/>
<xsd:enumeration value="triggerJourney"/>
<xsd:enumeration value="createFlowApprovalProcess"/>
<xsd:enumeration value="getContentNote"/>
<xsd:enumeration value="cancelSdrOutreach"/>
<xsd:enumeration value="getMeetingOwner"/>
<xsd:enumeration value="createPersnlRecommender"/>
<xsd:enumeration value="createContextPersonalization"/>
<xsd:enumeration value="activationSchema"/>
<xsd:enumeration value="getAllDataSpaces"/>
<xsd:enumeration value="summarizeFlow"/>
<xsd:enumeration value="sendNtfcnsForSvcMgmnt"/>
<xsd:enumeration value="sendMobileAppMessage"/>
<xsd:enumeration value="createExternalClientApp"/>
<xsd:enumeration value="writeOffInvoices"/>
<xsd:enumeration value="getPolicyDetails"/>
<xsd:enumeration value="getPoliciesByObject"/>
<xsd:enumeration value="getPoliciesByPolicyType"/>
<xsd:enumeration value="requestApproval"/>
<xsd:enumeration value="searchContractDocument"/>
<xsd:enumeration value="getOrExecFieldUpdtSuggestion"/>
<xsd:enumeration value="getOppStageDetails"/>
<xsd:enumeration value="getLearningProgramData"/>
<xsd:enumeration value="getAcademicTermData"/>
<xsd:enumeration value="getProgramTermApplTimelineData"/>
<xsd:enumeration value="updateFlowDefVersionStatus"/>
<xsd:enumeration value="getLsConfigKeyValues"/>
<xsd:enumeration value="cdpSegmentOverlapAction"/>
<xsd:enumeration value="syncSrvyRespOfflineRecords"/>
<xsd:enumeration value="guidedTroubleshooting"/>
<xsd:enumeration value="trgrOnDataCloudRecordIndexed"/>
<xsd:enumeration value="trgrOnContentDocumentLinkSubscription"/>
<xsd:enumeration value="cdpSegmentObservabilityMetrics"/>
<xsd:enumeration value="cdpCreateOverlapSegment"/>
<xsd:enumeration value="generateSalesInboxMeetingLink"/>
<xsd:enumeration value="createAccountPlanObjective"/>
<xsd:enumeration value="genAgentRecRequirements"/>
<xsd:enumeration value="genAgentRecDesign"/>
<xsd:enumeration value="genAgentRecBacklog"/>
</xsd:restriction>
</xsd:simpleType>

<!-- RecordTriggerType -->

<xsd:simpleType name="RecordTriggerType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Update"/>
<xsd:enumeration value="Create"/>
<xsd:enumeration value="CreateAndUpdate"/>
<xsd:enumeration value="Delete"/>
<xsd:enumeration value="None"/>
</xsd:restriction>
</xsd:simpleType>

<!-- Core / Action node types -->

<xsd:complexType name="FlowActionCall">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="actionCallPaths" minOccurs="0" maxOccurs="unbounded" type="tns:FlowActionCallPath"/>
<xsd:element name="actionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="actionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="dataTypeMappings" minOccurs="0" maxOccurs="unbounded" type="tns:FlowDataTypeMapping"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="flowTransactionModel" minOccurs="0" type="tns:FlowTransactionModel"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowActionCallInputParameter"/>
<xsd:element name="isWaitUntilCompleted" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="nameSegment" minOccurs="0" type="xsd:string"/>
<xsd:element name="offset" minOccurs="0" type="xsd:int"/>
<xsd:element name="offsetUnit" minOccurs="0" type="tns:FlowScheduledPathOffsetUnit"/>
<xsd:element name="outputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowActionCallOutputParameter"/>
<xsd:element name="storeOutputAutomatically" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="timeoutConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="versionSegment" minOccurs="0" type="xsd:int"/>
<xsd:element name="versionString" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowActionCallInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowActionCallOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowActionCallPath">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="connector" type="tns:FlowConnector"/>
<xsd:element name="pathName" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowApexPluginCall">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowApexPluginCallInputParameter"/>
<xsd:element name="outputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowApexPluginCallOutputParameter"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowApexPluginCallInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowApexPluginCallOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransform">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="transformValues" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValue">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="transformValueActions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValueAction"/>
<xsd:element name="transformValueDescription" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformValueLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformValueName" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValueAction">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="actionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="actionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="actionVersionString" minOccurs="0" type="xsd:string"/>
<xsd:element name="assignToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValueActionInputParameter"/>
<xsd:element name="name" minOccurs="0" type="xsd:string"/>
<xsd:element name="outputFieldApiName" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformType" type="tns:FlowTransformValueActionType"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValueActionInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowTransformValueActionType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Map"/>
<xsd:enumeration value="Count"/>
<xsd:enumeration value="Sum"/>
<xsd:enumeration value="GetItemByIndex"/>
<xsd:enumeration value="InnerJoin"/>
<xsd:enumeration value="InvocableAction"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowAssignment">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="assignmentItems" minOccurs="0" maxOccurs="unbounded" type="tns:FlowAssignmentItem"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowAssignmentItem">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="operator" minOccurs="0" type="tns:FlowAssignmentOperator"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowAssignmentOperator">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="None"/>
<xsd:enumeration value="Assign"/>
<xsd:enumeration value="Add"/>
<xsd:enumeration value="Subtract"/>
<xsd:enumeration value="AddItem"/>
<xsd:enumeration value="RemoveFirst"/>
<xsd:enumeration value="RemoveBeforeFirst"/>
<xsd:enumeration value="RemoveAfterFirst"/>
<xsd:enumeration value="RemoveAll"/>
<xsd:enumeration value="AddAtStart"/>
<xsd:enumeration value="RemoveUncommon"/>
<xsd:enumeration value="AssignCount"/>
<xsd:enumeration value="RemovePosition"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowChoice">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="userInput" minOccurs="0" type="tns:FlowChoiceUserInput"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowChoiceUserInput">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="isRequired" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="promptText" minOccurs="0" type="xsd:string"/>
<xsd:element name="validationRule" minOccurs="0" type="tns:FlowInputValidationRule"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowInputValidationRule">
<xsd:sequence>
<xsd:element name="errorMessage" type="xsd:string"/>
<xsd:element name="formulaExpression" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<xsd:complexType name="FlowCollectionProcessor">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="collectionProcessorType" type="tns:FlowCollectionProcessorType"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowCollectionProcessorType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Group"/>
<xsd:enumeration value="Split"/>
<xsd:enumeration value="Map"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowConstant">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowCustomError">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="customErrorMessages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCustomErrorMessage"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowCustomErrorMessage">
<xsd:sequence>
<xsd:element name="message" type="xsd:string"/>
<xsd:element name="language" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<xsd:complexType name="FlowDecision">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="defaultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="defaultConnectorLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="rules" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRule"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Record / DB related flow types -->

<xsd:complexType name="FlowRecordCreate">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="assignRecordIdToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="doesUpsert" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="doesUpsertAllOrNone" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="inputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowInputFieldAssignment"/>
<xsd:element name="inputReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
<xsd:element name="operationMultMatchingRecords" minOccurs="0" type="xsd:string"/>
<xsd:element name="operationOneMatchingRecord" minOccurs="0" type="xsd:string"/>
<xsd:element name="operationZeroMatchingRecords" minOccurs="0" type="xsd:string"/>
<xsd:element name="storeOutputAutomatically" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="upsertExternalIdField" minOccurs="0" type="xsd:string"/>
<xsd:element name="upsertStandardIdField" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRecordDelete">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="inputReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRecordLookup">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="assignNullValuesIfNoRecordsFound" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="getFirstRecordOnly" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="limit" minOccurs="0" type="tns:FlowElementReferenceOrValue" nillable="true"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
<xsd:element name="outputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowOutputFieldAssignment"/>
<xsd:element name="outputReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="queriedFields" minOccurs="0" maxOccurs="unbounded" type="xsd:string"/>
<xsd:element name="relatedRecords" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRelatedRecordLookup" nillable="true"/>
<xsd:element name="sortField" minOccurs="0" type="xsd:string"/>
<xsd:element name="sortOrder" minOccurs="0" type="tns:SortOrder"/>
<xsd:element name="storeOutputAutomatically" minOccurs="0" type="xsd:boolean"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRecordRollback">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRecordUpdate">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="inputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowInputFieldAssignment"/>
<xsd:element name="inputReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- UI / Flow structure types -->

<xsd:complexType name="FlowTextTemplate">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="isViewedAsPlainText" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="text" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowVariable">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="apexClass" minOccurs="0" type="xsd:string"/>
<xsd:element name="dataType" type="tns:FlowDataType"/>
<xsd:element name="isCollection" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isInput" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isOutput" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="objectType" minOccurs="0" type="xsd:string"/>
<xsd:element name="scale" minOccurs="0" type="xsd:int"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStage">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="isActive" type="xsd:boolean"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="stageOrder" type="xsd:int"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowStep">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connectors" minOccurs="0" maxOccurs="unbounded" type="tns:FlowConnector"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowSubflow">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="flowName" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowSubflowInputAssignment"/>
<xsd:element name="outputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowSubflowOutputAssignment"/>
<xsd:element name="storeOutputAutomatically" minOccurs="0" type="xsd:boolean"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreen">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="actions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenAction"/>
<xsd:element name="allowBack" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="allowFinish" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="allowPause" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="backButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="fields" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenField"/>
<xsd:element name="helpText" minOccurs="0" type="xsd:string"/>
<xsd:element name="nextOrFinishButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="pauseButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="pausedText" minOccurs="0" type="xsd:string"/>
<xsd:element name="rules" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenRule"/>
<xsd:element name="showFooter" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="showHeader" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="stageReference" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="triggers" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenTrigger"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowRunInMode">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="DefaultMode"/>
<xsd:enumeration value="SystemModeWithSharing"/>
<xsd:enumeration value="SystemModeWithoutSharing"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowVersionStatus">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Active"/>
<xsd:enumeration value="Draft"/>
<xsd:enumeration value="Obsolete"/>
<xsd:enumeration value="InvalidDraft"/>
<xsd:enumeration value="UnderReview"/>
</xsd:restriction>
</xsd:simpleType>

<!-- Small helper types for screens and stages -->

<xsd:simpleType name="FlowScreenFieldInputsRevisited">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="UseStoredValues"/>
<xsd:enumeration value="ResetValues"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowRegionContainerType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="SectionWithHeader"/>
<xsd:enumeration value="SectionWithoutHeader"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowScreenFieldStyleProperties">
<xsd:sequence>
<xsd:element name="verticalAlignment" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="width" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:complexType>

<xsd:complexType name="FlowIcon">
<xsd:sequence>
<xsd:element name="iconName" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<xsd:complexType name="FlowVisibilityRule">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="conditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenFieldTranslation">
<xsd:sequence>
<xsd:element name="fieldText" minOccurs="0" type="xsd:string"/>
<xsd:element name="helpText" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowInputParameterTranslation"/>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="validationRule" minOccurs="0" type="tns:FlowInputValidationRuleTranslation"/>
</xsd:sequence>
</xsd:complexType>

<!-- Common condition type -->

<xsd:complexType name="FlowCondition">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="aggregationOperator" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditionType" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="leftValueReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="operator" type="tns:FlowComparisonOperator"/>
<xsd:element name="rightValue" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Input / output field assignments -->

<xsd:complexType name="FlowInputFieldAssignment">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="field" minOccurs="0" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowOutputFieldAssignment">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="field" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRecordFilter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="field" minOccurs="0" type="xsd:string"/>
<xsd:element name="operator" minOccurs="0" type="tns:FlowRecordFilterOperator"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowRelatedRecordLookup">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter" nillable="true"/>
<xsd:element name="getFirstRecordOnly" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="limit" minOccurs="0" type="tns:FlowElementReferenceOrValue" nillable="true"/>
<xsd:element name="queriedFields" minOccurs="0" maxOccurs="unbounded" type="xsd:string" nillable="true"/>
<xsd:element name="relatedObject" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="relatedRecords" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRelatedRecordLookup" nillable="true"/>
<xsd:element name="relationshipField" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="sortField" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="sortOrder" minOccurs="0" type="tns:SortOrder"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Screen parameter types -->

<xsd:complexType name="FlowScreenActionInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenFieldInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenFieldOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenRule">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="conditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="ruleActions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenRuleAction"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenRuleAction">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="attribute" type="xsd:string"/>
<xsd:element name="fieldReference" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenTrigger">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="eventName" type="xsd:string"/>
<xsd:element name="eventSource" type="xsd:string"/>
<xsd:element name="handlers" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenTriggerHandler"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowScreenTriggerHandler">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="conditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="initBehavior" minOccurs="0" type="xsd:string"/>
<xsd:element name="screenActionName" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowSubflowInputAssignment">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowSubflowOutputAssignment">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Wait / event types -->

<xsd:complexType name="FlowWaitEventInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" minOccurs="0" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowWaitEventOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Inline transform & transform helpers -->

<xsd:complexType name="FlowInlineTransform">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="apexClass" minOccurs="0" type="xsd:string"/>
<xsd:element name="dataType" minOccurs="0" type="tns:FlowDataType"/>
<xsd:element name="isCollection" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="objectType" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformValues" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValue">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="transformValueActions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValueAction"/>
<xsd:element name="transformValueDescription" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformValueLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformValueName" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValueAction">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="actionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="actionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="actionVersionString" minOccurs="0" type="xsd:string"/>
<xsd:element name="assignToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTransformValueActionInputParameter"/>
<xsd:element name="name" minOccurs="0" type="xsd:string"/>
<xsd:element name="outputFieldApiName" minOccurs="0" type="xsd:string"/>
<xsd:element name="transformType" type="tns:FlowTransformValueActionType"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowTransformValueActionInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowTransformValueActionType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Map"/>
<xsd:enumeration value="Count"/>
<xsd:enumeration value="Sum"/>
<xsd:enumeration value="GetItemByIndex"/>
<xsd:enumeration value="InnerJoin"/>
<xsd:enumeration value="InvocableAction"/>
</xsd:restriction>
</xsd:simpleType>

<!-- Small supporting/simple types -->

<xsd:simpleType name="SortOrder">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Asc"/>
<xsd:enumeration value="Desc"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:simpleType name="FlowTransactionModel">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Automatic"/>
<xsd:enumeration value="NewTransaction"/>
<xsd:enumeration value="CurrentTransaction"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowCustomProperty">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:complexType>

<xsd:simpleType name="FlowEnvironment">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="Default"/>
<xsd:enumeration value="Slack"/>
<xsd:enumeration value="Offline"/>
</xsd:restriction>
</xsd:simpleType>

<xsd:complexType name="FlowExperiment">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="duration" minOccurs="0" type="xsd:int"/>
<xsd:element name="durationUnit" minOccurs="0" type="tns:FlowScheduledPathOffsetUnit"/>
<xsd:element name="paths" minOccurs="0" maxOccurs="unbounded" type="tns:FlowExperimentPath"/>
<xsd:element name="primaryMetric" minOccurs="0" type="xsd:string"/>
<xsd:element name="testGroupPercentage" minOccurs="0" type="xsd:int"/>
<xsd:element name="type" type="tns:FlowExperimentType"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:simpleType name="FlowExperimentType">
<xsd:restriction base="xsd:string"/>
</xsd:simpleType>

<xsd:complexType name="FlowLoop">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="assignNextValueToReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="collectionReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="iterationOrder" minOccurs="0" type="tns:IterationOrder"/>
<xsd:element name="nextValueConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="noMoreValuesConnector" minOccurs="0" type="tns:FlowConnector"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowOrchestratedStage">
<xsd:complexContent>
<xsd:extension base="tns:FlowNode">
<xsd:sequence>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="exitActionInputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepExitActionInputParameter"/>
<xsd:element name="exitActionName" minOccurs="0" type="xsd:string"/>
<xsd:element name="exitActionOutputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStepExitActionOutputParameter"/>
<xsd:element name="exitActionType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="exitConditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="exitConditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="faultConnector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="stageSteps" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageStep"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowDynamicChoiceSet">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="collectionReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="dataType" type="tns:FlowDataType"/>
<xsd:element name="displayField" type="xsd:string"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="limit" minOccurs="0" type="xsd:int" nillable="true"/>
<xsd:element name="object" type="xsd:string"/>
<xsd:element name="outputAssignments" minOccurs="0" maxOccurs="unbounded" type="tns:FlowOutputFieldAssignment"/>
<xsd:element name="picklistField" minOccurs="0" type="xsd:string"/>
<xsd:element name="picklistObject" minOccurs="0" type="xsd:string"/>
<xsd:element name="sortField" minOccurs="0" type="xsd:string"/>
<xsd:element name="sortOrder" minOccurs="0" type="tns:SortOrder"/>
<xsd:element name="valueField" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowExitRule">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="logicalOperator" type="xsd:string"/>
<xsd:element name="ruleOrder" type="xsd:int"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<xsd:complexType name="FlowFormula">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="dataType" minOccurs="0" type="tns:FlowDataType"/>
<xsd:element name="expression" type="xsd:string"/>
<xsd:element name="scale" minOccurs="0" type="xsd:int"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- Translation helper types for screen fields -->

<xsd:complexType name="FlowInputValidationRuleTranslation">
<xsd:sequence>
<xsd:element name="errorMessage" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<xsd:complexType name="FlowInputParameterTranslation">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" type="tns:FlowFerovTranslation"/>
</xsd:sequence>
</xsd:complexType>

<!-- Additional Flow-related types from metadata.xml -->

<!-- FlowCoverageResult -->

<xsd:complexType name="FlowCoverageResult">
<xsd:sequence>
<xsd:element name="elementsNotCovered" minOccurs="0" maxOccurs="unbounded" type="xsd:string"/>
<xsd:element name="flowId" type="xsd:string"/>
<xsd:element name="flowName" type="xsd:string"/>
<xsd:element name="flowNamespace" type="xsd:string" nillable="true"/>
<xsd:element name="numElements" type="xsd:int"/>
<xsd:element name="numElementsNotCovered" type="xsd:int"/>
<xsd:element name="processType" type="tns:FlowProcessType"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowCoverageWarning -->

<xsd:complexType name="FlowCoverageWarning">
<xsd:sequence>
<xsd:element name="flowId" type="xsd:string" nillable="true"/>
<xsd:element name="flowName" type="xsd:string" nillable="true"/>
<xsd:element name="flowNamespace" type="xsd:string" nillable="true"/>
<xsd:element name="message" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowCollectionMapItem -->

<xsd:complexType name="FlowCollectionMapItem">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToFieldReference" type="xsd:string"/>
<xsd:element name="operator" type="tns:FlowAssignmentOperator"/>
<xsd:element name="value" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowCollectionSortOption -->

<xsd:complexType name="FlowCollectionSortOption">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="doesPutEmptyStringAndNullFirst" type="xsd:boolean"/>
<xsd:element name="sortField" minOccurs="0" type="xsd:string"/>
<xsd:element name="sortOrder" type="tns:SortOrder"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStageStepAssignee -->

<xsd:complexType name="FlowStageStepAssignee">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignee" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
<xsd:element name="assigneeType" type="tns:FlowStageStepAssigneeType"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStageStepInputParameter -->

<xsd:complexType name="FlowStageStepInputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStageStepOutputConfigParam -->

<xsd:complexType name="FlowStageStepOutputConfigParam">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="value" type="tns:FlowElementReferenceOrValue"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowStageStepOutputParameter -->

<xsd:complexType name="FlowStageStepOutputParameter">
<xsd:complexContent>
<xsd:extension base="tns:FlowBaseElement">
<xsd:sequence>
<xsd:element name="assignToReference" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowRule -->

<xsd:complexType name="FlowRule">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="conditionLogic" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="doesRequireRecordChangedToMeetCriteria" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="label" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowWaitEvent -->

<xsd:complexType name="FlowWaitEvent">
<xsd:complexContent>
<xsd:extension base="tns:FlowElement">
<xsd:sequence>
<xsd:element name="associatedElement" minOccurs="0" type="xsd:string"/>
<xsd:element name="automationEventName" minOccurs="0" type="xsd:string"/>
<xsd:element name="automationEventType" minOccurs="0" type="tns:InvocableActionType"/>
<xsd:element name="conditionLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCondition"/>
<xsd:element name="connector" minOccurs="0" type="tns:FlowConnector"/>
<xsd:element name="eventType" minOccurs="0" type="xsd:string"/>
<xsd:element name="filterLogic" minOccurs="0" type="xsd:string"/>
<xsd:element name="filters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowRecordFilter"/>
<xsd:element name="inputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowWaitEventInputParameter"/>
<xsd:element name="interactionType" minOccurs="0" type="tns:FlowWaitInteractionType"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="maxBatchSize" minOccurs="0" type="xsd:int"/>
<xsd:element name="object" minOccurs="0" type="xsd:string"/>
<xsd:element name="offset" minOccurs="0" type="xsd:int"/>
<xsd:element name="offsetUnit" minOccurs="0" type="tns:FlowScheduledPathOffsetUnit"/>
<xsd:element name="outputParameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowWaitEventOutputParameter"/>
<xsd:element name="recordTriggerType" minOccurs="0" type="tns:RecordTriggerType"/>
<xsd:element name="resumeDate" minOccurs="0" type="xsd:date"/>
<xsd:element name="resumeDateReference" minOccurs="0" type="xsd:string"/>
<xsd:element name="resumeTime" minOccurs="0" type="xsd:time"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowCategory -->

<xsd:complexType name="FlowCategory">
<xsd:complexContent>
<xsd:extension base="tns:Metadata">
<xsd:sequence>
<xsd:element name="description" minOccurs="0" type="xsd:string"/>
<xsd:element name="flowCategoryItems" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCategoryItems"/>
<xsd:element name="masterLabel" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowCategoryItems -->

<xsd:complexType name="FlowCategoryItems">
<xsd:sequence>
<xsd:element name="flow" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowDefinition -->

<xsd:complexType name="FlowDefinition">
<xsd:complexContent>
<xsd:extension base="tns:Metadata">
<xsd:sequence>
<xsd:element name="activeVersionNumber" minOccurs="0" type="xsd:int"/>
<xsd:element name="description" minOccurs="0" type="xsd:string"/>
<xsd:element name="masterLabel" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowSettings -->

<xsd:complexType name="FlowSettings">
<xsd:complexContent>
<xsd:extension base="tns:Metadata">
<xsd:sequence>
<xsd:element name="canDebugFlowAsAnotherUser" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="doesEnforceApexCpuTimeLimit" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="doesFormulaEnforceDataAccess" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="doesFormulaGenerateHtmlOutput" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableEmailSimpleRespectProfiles" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableEmailsimpleSecureProfiles" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowBREncodedFixEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowCustomPropertyEditor" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowDeployAsActiveEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowFieldFilterEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowFormulasFixEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowInterviewSharingEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowNullPreviousValueFix" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowPauseEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowReactiveChoiceOptions" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowReactiveScreens" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowUseApexExceptionEmail" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableFlowViaRestUsesUserCtxt" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="enableLightningRuntimeEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isApexPluginAccessModifierRespected" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isEnhancedFlowListViewVisible" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isFlowBlockAccessToSessionIDEnabled" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isManageFlowRequiredForAutomationCharts" minOccurs="0" type="xsd:boolean"/>
<xsd:element name="isSupportRollbackOnErrorForApexInvocableActionsEnabled" minOccurs="0" type="xsd:boolean"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowTest -->

<xsd:complexType name="FlowTest">
<xsd:complexContent>
<xsd:extension base="tns:Metadata">
<xsd:sequence>
<xsd:element name="description" minOccurs="0" type="xsd:string"/>
<xsd:element name="flowApiName" type="xsd:string"/>
<xsd:element name="label" type="xsd:string"/>
<xsd:element name="testPoints" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTestPoint"/>
</xsd:sequence>
</xsd:extension>
</xsd:complexContent>
</xsd:complexType>

<!-- FlowTestPoint -->

<xsd:complexType name="FlowTestPoint">
<xsd:sequence>
<xsd:element name="assertions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTestAssertion"/>
<xsd:element name="elementApiName" type="xsd:string"/>
<xsd:element name="parameters" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTestParameter"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTestAssertion -->

<xsd:complexType name="FlowTestAssertion">
<xsd:sequence>
<xsd:element name="conditions" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTestCondition"/>
<xsd:element name="errorMessage" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTestCondition -->

<xsd:complexType name="FlowTestCondition">
<xsd:sequence>
<xsd:element name="leftValueReference" type="xsd:string"/>
<xsd:element name="operator" type="tns:FlowComparisonOperator"/>
<xsd:element name="rightValue" minOccurs="0" type="tns:FlowTestReferenceOrValue"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTestReferenceOrValue -->

<xsd:complexType name="FlowTestReferenceOrValue">
<xsd:sequence>
<xsd:element name="booleanValue" minOccurs="0" type="xsd:boolean" nillable="true"/>
<xsd:element name="dateTimeValue" minOccurs="0" type="xsd:dateTime"/>
<xsd:element name="dateValue" minOccurs="0" type="xsd:date"/>
<xsd:element name="numberValue" minOccurs="0" type="xsd:double" nillable="true"/>
<xsd:element name="sobjectValue" minOccurs="0" type="xsd:string" nillable="true"/>
<xsd:element name="stringValue" minOccurs="0" type="xsd:string"/>
<xsd:element name="timeValue" minOccurs="0" type="xsd:time"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTestParameter -->

<xsd:complexType name="FlowTestParameter">
<xsd:sequence>
<xsd:element name="leftValueReference" type="xsd:string"/>
<xsd:element name="type" type="tns:FlowTestParameterType"/>
<xsd:element name="value" type="tns:FlowTestReferenceOrValue"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowDefinitionTranslation -->

<xsd:complexType name="FlowDefinitionTranslation">
<xsd:sequence>
<xsd:element name="flows" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTranslation"/>
<xsd:element name="fullName" type="xsd:string"/>
<xsd:element name="label" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTranslation -->

<xsd:complexType name="FlowTranslation">
<xsd:sequence>
<xsd:element name="choices" minOccurs="0" maxOccurs="unbounded" type="tns:FlowChoiceTranslation"/>
<xsd:element name="customErrorMessages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowCustomErrorMessageTranslation"/>
<xsd:element name="fullName" minOccurs="0" type="xsd:string"/>
<xsd:element name="label" minOccurs="0" type="xsd:string"/>
<xsd:element name="orchestrationStages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowOrchestrationStageTranslation"/>
<xsd:element name="orchestrationSteps" minOccurs="0" maxOccurs="unbounded" type="tns:FlowOrchestrationStepTranslation"/>
<xsd:element name="screens" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenTranslation"/>
<xsd:element name="stages" minOccurs="0" maxOccurs="unbounded" type="tns:FlowStageTranslation"/>
<xsd:element name="textTemplates" minOccurs="0" maxOccurs="unbounded" type="tns:FlowTextTemplateTranslation"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowChoiceTranslation -->

<xsd:complexType name="FlowChoiceTranslation">
<xsd:sequence>
<xsd:element name="choiceText" minOccurs="0" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="userInput" minOccurs="0" type="tns:FlowChoiceUserInputTranslation"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowChoiceUserInputTranslation -->

<xsd:complexType name="FlowChoiceUserInputTranslation">
<xsd:sequence>
<xsd:element name="promptText" minOccurs="0" type="xsd:string"/>
<xsd:element name="validationRule" minOccurs="0" type="tns:FlowInputValidationRuleTranslation"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowCustomErrorMessageTranslation -->

<xsd:complexType name="FlowCustomErrorMessageTranslation">
<xsd:sequence>
<xsd:element name="developerName" type="xsd:string"/>
<xsd:element name="errorMessage" minOccurs="0" type="xsd:string"/>
<xsd:element name="field" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowOrchestrationStageTranslation -->

<xsd:complexType name="FlowOrchestrationStageTranslation">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="stageLabel" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowOrchestrationStepTranslation -->

<xsd:complexType name="FlowOrchestrationStepTranslation">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="stepLabel" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowScreenTranslation -->

<xsd:complexType name="FlowScreenTranslation">
<xsd:sequence>
<xsd:element name="backButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="fields" minOccurs="0" maxOccurs="unbounded" type="tns:FlowScreenFieldTranslation"/>
<xsd:element name="helpText" minOccurs="0" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="nextOrFinishButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="pauseButtonLabel" minOccurs="0" type="xsd:string"/>
<xsd:element name="pausedText" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowComplexLiteralTranslation -->

<xsd:complexType name="FlowComplexLiteralTranslation">
<xsd:sequence>
<xsd:element name="customAspectKey" minOccurs="0" type="xsd:string"/>
<xsd:element name="value" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowStageTranslation -->

<xsd:complexType name="FlowStageTranslation">
<xsd:sequence>
<xsd:element name="label" minOccurs="0" type="xsd:string"/>
<xsd:element name="name" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- FlowTextTemplateTranslation -->

<xsd:complexType name="FlowTextTemplateTranslation">
<xsd:sequence>
<xsd:element name="name" type="xsd:string"/>
<xsd:element name="text" minOccurs="0" type="xsd:string"/>
</xsd:sequence>
</xsd:complexType>

<!-- Simple Types -->

<!-- FlowStageStepAssigneeType -->

<xsd:simpleType name="FlowStageStepAssigneeType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="User"/>
<xsd:enumeration value="Group"/>
<xsd:enumeration value="Queue"/>
<xsd:enumeration value="Invalid"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowScreenFieldType -->

<xsd:simpleType name="FlowScreenFieldType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="DisplayText"/>
<xsd:enumeration value="InputField"/>
<xsd:enumeration value="LargeTextArea"/>
<xsd:enumeration value="PasswordField"/>
<xsd:enumeration value="RadioButtons"/>
<xsd:enumeration value="DropdownBox"/>
<xsd:enumeration value="MultiSelectCheckboxes"/>
<xsd:enumeration value="MultiSelectPicklist"/>
<xsd:enumeration value="ComponentInstance"/>
<xsd:enumeration value="ComponentInput"/>
<xsd:enumeration value="ComponentChoice"/>
<xsd:enumeration value="ComponentMultiChoice"/>
<xsd:enumeration value="ComponentDisplay"/>
<xsd:enumeration value="Repeater"/>
<xsd:enumeration value="RegionContainer"/>
<xsd:enumeration value="Region"/>
<xsd:enumeration value="ObjectProvided"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowElementSubtype -->

<xsd:simpleType name="FlowElementSubtype">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="SortCollectionProcessor"/>
<xsd:enumeration value="RecommendationMapCollectionProcessor"/>
<xsd:enumeration value="FilterCollectionProcessor"/>
<xsd:enumeration value="WaitDate"/>
<xsd:enumeration value="WaitUntilEvent"/>
<xsd:enumeration value="WaitAttribute"/>
<xsd:enumeration value="WaitDuration"/>
<xsd:enumeration value="InteractiveStep"/>
<xsd:enumeration value="BackgroundStep"/>
<xsd:enumeration value="MuleSoftStep"/>
<xsd:enumeration value="ManagedContentRoleInteractiveStep"/>
<xsd:enumeration value="ManagedContentVariantSetLockBackgroundStep"/>
<xsd:enumeration value="ManagedContentVariantSetReadyBackgroundStep"/>
<xsd:enumeration value="ManagedContentVariantAutoPublishBackgroundStep"/>
<xsd:enumeration value="ManagedContentVariantAutoUnpublishBackgroundStep"/>
<xsd:enumeration value="AddPromptInstructions"/>
<xsd:enumeration value="ApprovalStep"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowWaitInteractionType -->

<xsd:simpleType name="FlowWaitInteractionType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="SmsResponse"/>
<xsd:enumeration value="WhatsappResponse"/>
</xsd:restriction>
</xsd:simpleType>

<!-- FlowTestParameterType -->

<xsd:simpleType name="FlowTestParameterType">
<xsd:restriction base="xsd:string">
<xsd:enumeration value="InputTriggeringRecordInitial"/>
<xsd:enumeration value="InputTriggeringRecordUpdated"/>
<xsd:enumeration value="ScheduledPath"/>
</xsd:restriction>
</xsd:simpleType>
