import { CloseButton, FormControl, HStack, Select } from "@chakra-ui/react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  RelationalExpressionLeftOperandType,
  RelationalExpressionOperator,
  RelationalExpressionRightOperandType,
} from "../../types";
import { ArticlePropertySelect } from "./ArticlePropertySelect";
import { ConditionInput } from "./ConditionInput";

const { Equals, Contains, Matches, NotContain, NotEqual } = RelationalExpressionOperator;

interface Props {
  onDelete: () => void;
  prefix?: string;
  deletable?: boolean;
  data: {
    feedId?: string;
  };
}

export const Condition = ({ onDelete, prefix = "", deletable, data }: Props) => {
  const { control, watch } = useFormContext();

  const { t } = useTranslation();
  const leftOperandType = watch(`${prefix}left.type`) as
    | RelationalExpressionLeftOperandType
    | RelationalExpressionRightOperandType;

  let leftOperandElement: React.ReactElement = (
    <ConditionInput
      controllerName={`${prefix}left.value`}
      placeholder={t("features.feedConnections.components.filtersForm.placeholderArticleProperty")}
    />
  );

  if (leftOperandType === RelationalExpressionLeftOperandType.Article) {
    leftOperandElement = (
      <ArticlePropertySelect
        controllerName={`${prefix}left.value`}
        data={data}
        placeholder={t(
          "features.feedConnections.components.filtersForm.placeholderSelectArticleProperty"
        )}
      />
    );
  }

  return (
    <HStack width="100%" alignItems="flex-start">
      <HStack width="100%" spacing={8} alignItems="flex-start">
        {leftOperandElement}
        <FormControl>
          <Controller
            name={`${prefix}op`}
            control={control}
            render={({ field }) => (
              <Select flexShrink={1} {...field}>
                <option value={Equals}>
                  {t("features.feedConnections.components.filtersForm.relationalOpEquals")}
                </option>
                <option value={NotEqual}>
                  {t("features.feedConnections.components.filtersForm.relationalOpNotEqual")}
                </option>
                <option value={Contains}>
                  {t("features.feedConnections.components.filtersForm.relationalOpContains")}
                </option>
                <option value={NotContain}>
                  {t("features.feedConnections.components.filtersForm.relationalOpDoesNotContain")}
                </option>
                <option value={Matches}>
                  {t("features.feedConnections.components.filtersForm.relationalOpMatches")}
                </option>
              </Select>
            )}
          />
        </FormControl>
        <ConditionInput
          controllerName={`${prefix}right.value`}
          placeholder={t("features.feedConnections.components.filtersForm.placeholderArticleValue")}
        />
      </HStack>
      {deletable && <CloseButton aria-label="Delete condition" size="sm" onClick={onDelete} />}
    </HStack>
  );
};
