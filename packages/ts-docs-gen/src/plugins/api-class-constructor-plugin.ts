import { Contracts } from "ts-extractor";
import { MarkdownBuilder, MarkdownGenerator } from "@simplrjs/markdown";
import { Plugin, SupportedApiItemKindType, PluginOptions, PluginResult, PluginResultData } from "../contracts/plugin";
import { GeneratorHelpers } from "../generator-helpers";

export class ApiClassConstructorPlugin implements Plugin<Contracts.ApiClassConstructorDto> {
    public SupportedApiItemKinds(): SupportedApiItemKindType[] {
        return [GeneratorHelpers.ApiItemKinds.ClassConstructor];
    }

    public CheckApiItem(item: Contracts.ApiItemDto): boolean {
        return true;
    }

    private renderParameters(parameters: Contracts.ApiParameterDto[]): PluginResultData {
        const pluginResult = GeneratorHelpers.GetDefaultPluginResultData();
        if (parameters.length === 0) {
            return pluginResult;
        }

        let referenceIds: string[] = [];
        const header = ["Name", "Type", "Description"];

        const content = parameters.map(parameter => {
            const parameterTypeDto = GeneratorHelpers.TypeDtoToMarkdownString(parameter.Type);

            referenceIds = referenceIds.concat(parameterTypeDto.References);

            return [parameter.Name, MarkdownGenerator.EscapeString(parameterTypeDto.Text), parameter.Metadata.DocumentationComment];
        });

        const builder = new MarkdownBuilder()
            .Header("Parameters", 4)
            .EmptyLine()
            .Table(header, content, GeneratorHelpers.DEFAULT_TABLE_OPTIONS)
            .EmptyLine();

        pluginResult.UsedReferences = referenceIds;
        pluginResult.Result = builder.GetOutput();

        return pluginResult;
    }

    public Render(options: PluginOptions<Contracts.ApiClassConstructorDto>): PluginResult {
        const pluginResult = GeneratorHelpers.GetDefaultPluginResultData();
        const builder = new MarkdownBuilder();

        // Parameters
        const apiParameters = GeneratorHelpers
            .GetApiItemsFromReference<Contracts.ApiParameterDto>(options.ApiItem.Parameters, options.ExtractedData);
        const parameters = this.renderParameters(apiParameters);

        const heading = GeneratorHelpers.MethodToSimpleString("constructor", apiParameters);

        pluginResult.Headings.push({ ApiItemId: options.Reference.Id, Heading: heading });

        builder
            .Header(heading, 3)
            .EmptyLine()
            .Text(GeneratorHelpers.RenderApiItemMetadata(options.ApiItem))
            .Code(GeneratorHelpers.ApiClassConstructorToString(apiParameters), GeneratorHelpers.DEFAULT_CODE_OPTIONS)
            .Text(parameters.Result);

        GeneratorHelpers.MergePluginResultData(pluginResult, parameters);
        pluginResult.Result = builder.GetOutput();

        return {
            ApiItem: options.ApiItem,
            Reference: options.Reference,
            ...pluginResult
        };
    }
}
