"use client";

import { ThreeDotsLoader } from "@/components/Loading";
import { PageSelector } from "@/components/PageSelector";
import { CPUIcon, EditIcon, TrashIcon } from "@/components/icons/icons";
import { SlackBotConfig } from "@/lib/types";
import { useState } from "react";
import { useSlackBotConfigs, useSlackBotTokens } from "./hooks";
import { PopupSpec, usePopup } from "@/components/admin/connectors/Popup";
import { deleteSlackBotConfig, isPersonaASlackBotPersona } from "./lib";
import { SlackBotTokensForm } from "./SlackBotTokensForm";
import { AdminPageTitle } from "@/components/admin/Title";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from "@tremor/react";
import { FiArrowUpRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import Link from "next/link";

const numToDisplay = 50;

const SlackBotConfigsTable = ({
  slackBotConfigs,
  refresh,
  setPopup,
}: {
  slackBotConfigs: SlackBotConfig[];
  refresh: () => void;
  setPopup: (popupSpec: PopupSpec | null) => void;
}) => {
  const [page, setPage] = useState(1);

  // sort by name for consistent ordering
  slackBotConfigs.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0;
    }
  });

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Channels</TableHeaderCell>
            <TableHeaderCell>Persona</TableHeaderCell>
            <TableHeaderCell>Document Sets</TableHeaderCell>
            <TableHeaderCell>Delete</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {slackBotConfigs
            .slice(numToDisplay * (page - 1), numToDisplay * page)
            .map((slackBotConfig) => {
              return (
                <TableRow key={slackBotConfig.id}>
                  <TableCell>
                    <div className="flex gap-x-2">
                      <Link
                        className="cursor-pointer my-auto"
                        href={`/admin/bot/${slackBotConfig.id}`}
                      >
                        <EditIcon />
                      </Link>
                      <div className="my-auto">
                        {slackBotConfig.channel_config.channel_names
                          .map((channel_name) => `#${channel_name}`)
                          .join(", ")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {slackBotConfig.persona &&
                    !isPersonaASlackBotPersona(slackBotConfig.persona) ? (
                      <Link
                        href={`/admin/personas/${slackBotConfig.persona.id}`}
                        className="text-blue-500 flex"
                      >
                        <FiArrowUpRight className="my-auto mr-1" />
                        {slackBotConfig.persona.name}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {" "}
                    <div>
                      {slackBotConfig.persona &&
                      slackBotConfig.persona.document_sets.length > 0
                        ? slackBotConfig.persona.document_sets
                            .map((documentSet) => documentSet.name)
                            .join(", ")
                        : "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {" "}
                    <div
                      className="cursor-pointer"
                      onClick={async () => {
                        const response = await deleteSlackBotConfig(
                          slackBotConfig.id
                        );
                        if (response.ok) {
                          setPopup({
                            message: `Slack bot config "${slackBotConfig.id}" deleted`,
                            type: "success",
                          });
                        } else {
                          const errorMsg = await response.text();
                          setPopup({
                            message: `Failed to delete Slack bot config - ${errorMsg}`,
                            type: "error",
                          });
                        }
                        refresh();
                      }}
                    >
                      <TrashIcon />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      <div className="mt-3 flex">
        <div className="mx-auto">
          <PageSelector
            totalPages={Math.ceil(slackBotConfigs.length / numToDisplay)}
            currentPage={page}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      </div>
    </div>
  );
};

const Main = () => {
  const [slackBotTokensModalIsOpen, setSlackBotTokensModalIsOpen] =
    useState(false);
  const { popup, setPopup } = usePopup();
  const {
    data: slackBotConfigs,
    isLoading: isSlackBotConfigsLoading,
    error: slackBotConfigsError,
    refreshSlackBotConfigs,
  } = useSlackBotConfigs();

  const { data: slackBotTokens, refreshSlackBotTokens } = useSlackBotTokens();

  if (isSlackBotConfigsLoading) {
    return <ThreeDotsLoader />;
  }

  if (slackBotConfigsError || !slackBotConfigs) {
    return <div>Error: {slackBotConfigsError}</div>;
  }

  return (
    <div className="mb-8 dark">
      {popup}

      <Text className="mb-2">
        Setup a Slack bot that connects to Danswer. Once setup, you will be able
        to ask questions to Danswer directly from Slack. Additionally, you can:
      </Text>

      <div className="text-dark-tremor-content text-sm mb-2">
        <ul className="list-disc mt-2 ml-4">
          <li>
            Setup DanswerBot to automatically answer questions in certain
            channels.
          </li>
          <li>
            Choose which document sets DanswerBot should answer from, depending
            on the channel the question is being asked.
          </li>
          <li>
            Directly message DanswerBot to search just as you would in the web
            UI.
          </li>
        </ul>
      </div>

      <Text className="mb-6">
        Follow the{" "}
        <a
          className="text-blue-500"
          href="https://docs.danswer.dev/slack_bot_setup"
          target="_blank"
        >
          guide{" "}
        </a>
        found in the Danswer documentation to get started!
      </Text>

      <Title>Step 1: Configure Slack Tokens</Title>
      {!slackBotTokens ? (
        <div className="mt-3">
          <SlackBotTokensForm
            onClose={() => refreshSlackBotTokens()}
            setPopup={setPopup}
          />
        </div>
      ) : (
        <>
          <Text className="italic mt-3">Tokens saved!</Text>
          <Button
            onClick={() => {
              setSlackBotTokensModalIsOpen(!slackBotTokensModalIsOpen);
              console.log(slackBotTokensModalIsOpen);
            }}
            variant="secondary"
            size="xs"
            className="mt-2"
            icon={slackBotTokensModalIsOpen ? FiChevronUp : FiChevronDown}
          >
            {slackBotTokensModalIsOpen ? "Hide" : "Edit Tokens"}
          </Button>
          {slackBotTokensModalIsOpen && (
            <div className="mt-3">
              <SlackBotTokensForm
                onClose={() => {
                  refreshSlackBotTokens();
                  setSlackBotTokensModalIsOpen(false);
                }}
                setPopup={setPopup}
                existingTokens={slackBotTokens}
              />
            </div>
          )}
        </>
      )}
      {slackBotTokens && (
        <>
          <Title className="mb-2 mt-4">Step 2: Setup DanswerBot</Title>
          <Text className="mb-3">
            Configure Danswer to automatically answer questions in Slack
            channels. By default, Danswer only responds in channels where a
            configuration is setup unless it is explicitly tagged.
          </Text>

          <div className="mb-2"></div>

          <Link className="flex mb-3" href="/admin/bot/new">
            <Button className="my-auto" variant="secondary" size="xs">
              New Slack Bot Configuration
            </Button>
          </Link>

          {slackBotConfigs.length > 0 && (
            <div className="mt-8">
              <SlackBotConfigsTable
                slackBotConfigs={slackBotConfigs}
                refresh={refreshSlackBotConfigs}
                setPopup={setPopup}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Page = () => {
  return (
    <div className="container mx-auto">
      <AdminPageTitle
        icon={<CPUIcon size={32} />}
        title="Slack Bot Configuration"
      />

      <Main />
    </div>
  );
};

export default Page;
