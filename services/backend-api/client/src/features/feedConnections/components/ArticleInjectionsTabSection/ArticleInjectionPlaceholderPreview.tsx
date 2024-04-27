import {
  Alert,
  AlertTitle,
  Box,
  Center,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useUserFeedContext } from "../../../../contexts/UserFeedContext";
import { ArticleInjection } from "../../../../types";
import { useUserFeedArticles } from "../../../feed";

interface Props {
  articleInjections: ArticleInjection[];
  formatOptions?: {
    formatTables: boolean;
    stripImages: boolean;
    disableImageLinkPreviews: boolean;
  };
}

export const ArticleInjectionPlaceholderPreview = ({ articleInjections, formatOptions }: Props) => {
  const { userFeed } = useUserFeedContext();
  const { data, status } = useUserFeedArticles({
    data: {
      limit: 1,
      skip: 0,
      selectProperties: ["*"],
      formatter: {
        options: {
          dateFormat: userFeed.formatOptions?.dateFormat,
          dateTimezone: userFeed.formatOptions?.dateTimezone,
          formatTables: formatOptions?.formatTables ?? false,
          stripImages: formatOptions?.stripImages ?? false,
          disableImageLinkPreviews: formatOptions?.disableImageLinkPreviews ?? false,
        },
        articleInjections,
        customPlaceholders: [],
      },
    },
    disabled: articleInjections.length === 0 || !formatOptions,
    feedId: userFeed.id,
  });

  if (!data || status === "loading") {
    return (
      <Center flexDir="column" gap={2} bg="gray.800" rounded="lg" p={4}>
        <Spinner />
        <Text color="whiteAlpha.700" fontSize="sm">
          Loading preview...
        </Text>
      </Center>
    );
  }

  const article = data?.result.articles[0];

  if (!article) {
    return (
      <Alert status="info">
        <AlertTitle>No articles were found in the feed to preview</AlertTitle>
      </Alert>
    );
  }

  return (
    <Box bg="gray.800" padding={2} rounded="lg" maxHeight={300} overflow="scroll">
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Placeholder</Th>
              <Th>Sample Article Placeholder Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {Object.entries(article).map(([key, value]) => (
              <Tr key={key}>
                <Td>{key}</Td>
                <Td>{value}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};