import { PersonasTable } from "./PersonaTable";
import { FiPlusSquare } from "react-icons/fi";
import Link from "next/link";
import { Divider, Text, Title } from "@tremor/react";
import { fetchSS } from "@/lib/utilsSS";
import { ErrorCallout } from "@/components/ErrorCallout";
import { Persona } from "./interfaces";
import { RobotIcon } from "@/components/icons/icons";
import { AdminPageTitle } from "@/components/admin/Title";

export default async function Page() {
  const personaResponse = await fetchSS("/persona");

  if (!personaResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={`Failed to fetch personas - ${await personaResponse.text()}`}
      />
    );
  }

  const personas = (await personaResponse.json()) as Persona[];

  return (
    <div className="dark">
      <AdminPageTitle icon={<RobotIcon size={32} />} title="Personas" />

      <Text className="mb-2">
        Personas are a way to build custom search/question-answering experiences
        for different use cases.
      </Text>
      <Text className="mt-2">They allow you to customize:</Text>
      <div className="text-dark-tremor-content text-sm">
        <ul className="list-disc mt-2 ml-4">
          <li>
            The prompt used by your LLM of choice to respond to the user query
          </li>
          <li>The documents that are used as context</li>
        </ul>
      </div>

      <div className="dark">
        <Divider />

        <Title>Create a Persona</Title>
        <Link
          href="/admin/personas/new"
          className="text-gray-100 flex py-2 px-4 mt-2 border border-gray-800 h-fit cursor-pointer hover:bg-gray-800 text-sm w-36"
        >
          <div className="mx-auto flex">
            <FiPlusSquare className="my-auto mr-2" />
            New Persona
          </div>
        </Link>

        <Divider />

        <Title>Existing Personas</Title>
        <PersonasTable personas={personas} />
      </div>
    </div>
  );
}
