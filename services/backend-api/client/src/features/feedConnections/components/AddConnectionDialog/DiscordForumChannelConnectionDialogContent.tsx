import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { InferType, object, string } from "yup";
import { useEffect, useRef } from "react";
import {
  DiscordChannelDropdown,
  DiscordServerSearchSelectv2,
  GetDiscordChannelType,
} from "@/features/discordServers";
import RouteParams from "../../../../types/RouteParams";
import { useCreateDiscordChannelConnection, useUpdateDiscordChannelConnection } from "../../hooks";
import { notifySuccess } from "../../../../utils/notifySuccess";
import { InlineErrorAlert, InlineErrorIncompleteFormAlert } from "../../../../components";
import { FeedDiscordChannelConnection } from "../../../../types";

const formSchema = object({
  name: string().required("Name is required").max(250, "Name must be fewer than 250 characters"),
  serverId: string().required("Discord server is required"),
  channelId: string().when("serverId", ([serverId], schema) => {
    if (serverId) {
      return schema.required("Discord forum channel is required");
    }

    return schema.optional();
  }),
});

interface Props {
  onClose: () => void;
  isOpen: boolean;
  connection?: FeedDiscordChannelConnection;
}

type FormData = InferType<typeof formSchema>;

export const DiscordForumChannelConnectionDialogContent: React.FC<Props> = ({
  connection,
  onClose,
  isOpen,
}) => {
  const defaultValues: Partial<FormData> = {
    name: connection?.name,
    serverId: connection?.details.channel?.guildId,
    channelId: connection?.details.channel?.id,
  };
  const { feedId } = useParams<RouteParams>();
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid, isSubmitted },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(formSchema),
    mode: "all",
    defaultValues,
  });
  const serverId = watch("serverId");
  const { mutateAsync, error } = useCreateDiscordChannelConnection();
  const { mutateAsync: updateMutateAsync, error: updateError } =
    useUpdateDiscordChannelConnection();
  const initialFocusRef = useRef<any>(null);

  useEffect(() => {
    reset(defaultValues);
  }, [connection?.id]);

  const onSubmit = async ({ channelId, name }: FormData) => {
    if (!feedId) {
      throw new Error("Feed ID missing while creating discord channel connection");
    }

    if (connection) {
      try {
        await updateMutateAsync({
          feedId,
          connectionId: connection.id,
          details: {
            name,
            channelId,
          },
        });

        notifySuccess(t("common.success.savedChanges"));
        onClose();
      } catch (err) {}

      return;
    }

    try {
      await mutateAsync({
        feedId,
        details: {
          name,
          channelId,
        },
      });
      notifySuccess(
        "Succesfully added connection. New articles will be automatically delivered when found."
      );
      onClose();
    } catch (err) {}
  };

  useEffect(() => {
    reset();
  }, [isOpen]);

  const formErrorLength = Object.keys(errors).length;

  const useError = error || updateError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={!isSubmitting}
      initialFocusRef={initialFocusRef}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {connection ? "Edit Discord Forum Connection" : "Add Discord Forum Connection"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <Text>Send articles as messages authored by the bot to a Discord forum</Text>
            <form id="addfeed" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.serverId} isRequired>
                  <FormLabel htmlFor="server-select">
                    {t(
                      "features.feed.components.addDiscordChannelConnectionDialog.formServerLabel"
                    )}
                  </FormLabel>
                  <Controller
                    name="serverId"
                    control={control}
                    render={({ field }) => (
                      <DiscordServerSearchSelectv2
                        {...field}
                        onChange={field.onChange}
                        value={field.value}
                        inputRef={initialFocusRef}
                        ariaLabelledBy="server-select"
                        inputId="server-select"
                        alertOnArticleEligibility
                        isInvalid={!!errors.serverId}
                      />
                    )}
                  />
                  <FormHelperText>
                    Only servers where you have server-wide Manage Channels permission will appear.
                    If you don&apos;t have this permission, you may ask someone who does to add the
                    feed and share it with you.
                  </FormHelperText>
                  <FormErrorMessage>{errors.serverId?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.channelId} isRequired>
                  <FormLabel id="channel-select-label" htmlFor="channel-select">
                    Discord Forum Channel
                  </FormLabel>
                  <Controller
                    name="channelId"
                    control={control}
                    render={({ field }) => (
                      <DiscordChannelDropdown
                        value={field.value}
                        isInvalid={!!errors.channelId}
                        onChange={(value, name) => {
                          field.onChange(value);
                          setValue("name", name, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                        types={[GetDiscordChannelType.Forum]}
                        onBlur={field.onBlur}
                        isDisabled={isSubmitting}
                        serverId={serverId}
                        inputId="channel-select"
                        ariaLabelledBy="channel-select-label"
                      />
                    )}
                  />
                  <FormErrorMessage>{errors.channelId?.message}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.name} isRequired>
                  <FormLabel>
                    {t("features.feed.components.addDiscordChannelConnectionDialog.formNameLabel")}
                  </FormLabel>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input {...field} bg="gray.800" />}
                  />
                  {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
                  <FormHelperText>
                    {t(
                      "features.feed.components" +
                        ".addDiscordChannelConnectionDialog.formNameDescription"
                    )}
                  </FormHelperText>
                </FormControl>
              </Stack>
            </form>
            {useError && (
              <InlineErrorAlert
                title={t("common.errors.somethingWentWrong")}
                description={useError.message}
              />
            )}
            {isSubmitted && formErrorLength > 0 && (
              <InlineErrorIncompleteFormAlert fieldCount={formErrorLength} />
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isSubmitting}>
              <span>{t("common.buttons.cancel")}</span>
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              form="addfeed"
              isLoading={isSubmitting}
              aria-disabled={isSubmitting || !isValid}
            >
              <span>
                {t("features.feed.components.addDiscordChannelConnectionDialog.saveButton")}
              </span>
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
