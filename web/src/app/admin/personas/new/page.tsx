import { PersonaEditor } from "../PersonaEditor";
import { fetchSS } from "@/lib/utilsSS";
import { ErrorCallout } from "@/components/ErrorCallout";
import { DocumentSet } from "@/lib/types";
import { RobotIcon } from "@/components/icons/icons";
import { BackButton } from "@/components/BackButton";
import { Card } from "@tremor/react";
import { AdminPageTitle } from "@/components/admin/Title";

export default async function Page() {
  const documentSetsResponse = await fetchSS("/manage/document-set");

  if (!documentSetsResponse.ok) {
    return (
      <ErrorCallout
        errorTitle="Something went wrong :("
        errorMsg={`Failed to fetch document sets - ${await documentSetsResponse.text()}`}
      />
    );
  }

  const documentSets = (await documentSetsResponse.json()) as DocumentSet[];

  return (
    <div className="dark">
      <BackButton />

      <AdminPageTitle
        title="Create a New Persona"
        icon={<RobotIcon size={32} />}
      />

      <Card>
        <PersonaEditor documentSets={documentSets} />
      </Card>
    </div>
  );
}
