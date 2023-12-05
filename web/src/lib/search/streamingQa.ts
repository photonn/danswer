import {
  AnswerPiecePacket,
  DanswerDocument,
  DocumentInfoPacket,
  ErrorMessagePacket,
  LLMRelevanceFilterPacket,
  QueryEventIdPacket,
  Quote,
  QuotesInfoPacket,
  SearchRequestArgs,
} from "./interfaces";
import { processRawChunkString } from "./streamingUtils";
import { buildFilters } from "./utils";

export const searchRequestStreamed = async ({
  query,
  chatSessionId,
  sources,
  documentSets,
  timeRange,
  updateCurrentAnswer,
  updateQuotes,
  updateDocs,
  updateSuggestedSearchType,
  updateSuggestedFlowType,
  updateSelectedDocIndices,
  updateError,
  updateQueryEventId,
  offset,
}: SearchRequestArgs) => {
  let answer = "";
  let quotes: Quote[] | null = null;
  let relevantDocuments: DanswerDocument[] | null = null;
  try {
    const filters = buildFilters(sources, documentSets, timeRange);
    const response = await fetch("/api/stream-direct-qa", {
      method: "POST",
      body: JSON.stringify({
        chat_session_id: chatSessionId,
        query,
        collection: "danswer_index",
        filters,
        enable_auto_detect_filters: false,
        offset: offset,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    let previousPartialChunk: string | null = null;
    while (true) {
      const rawChunk = await reader?.read();
      if (!rawChunk) {
        throw new Error("Unable to process chunk");
      }
      const { done, value } = rawChunk;
      if (done) {
        break;
      }

      // Process each chunk as it arrives
      const [completedChunks, partialChunk] = processRawChunkString<
        | AnswerPiecePacket
        | ErrorMessagePacket
        | QuotesInfoPacket
        | DocumentInfoPacket
        | LLMRelevanceFilterPacket
        | QueryEventIdPacket
      >(decoder.decode(value, { stream: true }), previousPartialChunk);
      if (!completedChunks.length && !partialChunk) {
        break;
      }
      previousPartialChunk = partialChunk as string | null;
      completedChunks.forEach((chunk) => {
        // check for answer peice / end of answer
        if (Object.hasOwn(chunk, "answer_piece")) {
          const answerPiece = (chunk as AnswerPiecePacket).answer_piece;
          if (answerPiece !== null) {
            answer += (chunk as AnswerPiecePacket).answer_piece;
            updateCurrentAnswer(answer);
          } else {
            // set quotes as non-null to signify that the answer is finished and
            // we're now looking for quotes
            updateQuotes([]);
            if (
              answer &&
              !answer.endsWith(".") &&
              !answer.endsWith("?") &&
              !answer.endsWith("!")
            ) {
              answer += ".";
              updateCurrentAnswer(answer);
            }
          }
          return;
        }

        if (Object.hasOwn(chunk, "error")) {
          updateError((chunk as ErrorMessagePacket).error);
          return;
        }

        // These all come together
        if (Object.hasOwn(chunk, "top_documents")) {
          chunk = chunk as DocumentInfoPacket;
          const topDocuments = chunk.top_documents as DanswerDocument[] | null;
          if (topDocuments) {
            relevantDocuments = topDocuments;
            updateDocs(relevantDocuments);
          }

          if (chunk.predicted_flow) {
            updateSuggestedFlowType(chunk.predicted_flow);
          }

          if (chunk.predicted_search) {
            updateSuggestedSearchType(chunk.predicted_search);
          }

          return;
        }

        if (Object.hasOwn(chunk, "relevant_chunk_indices")) {
          const relevantChunkIndices = (chunk as LLMRelevanceFilterPacket)
            .relevant_chunk_indices;
          if (relevantChunkIndices) {
            updateSelectedDocIndices(relevantChunkIndices);
          }
          return;
        }

        // Check for quote section
        if (Object.hasOwn(chunk, "quotes")) {
          quotes = (chunk as QuotesInfoPacket).quotes;
          updateQuotes(quotes);
          return;
        }

        // check for query ID section
        if (Object.hasOwn(chunk, "query_event_id")) {
          updateQueryEventId((chunk as QueryEventIdPacket).query_event_id);
          return;
        }

        // should never reach this
        console.log("Unknown chunk:", chunk);
      });
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
  return { answer, quotes, relevantDocuments };
};
