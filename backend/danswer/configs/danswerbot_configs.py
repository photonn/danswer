import os

#####
# Danswer Slack Bot Configs
#####
DANSWER_BOT_NUM_RETRIES = int(os.environ.get("DANSWER_BOT_NUM_RETRIES", "5"))
DANSWER_BOT_ANSWER_GENERATION_TIMEOUT = int(
    os.environ.get("DANSWER_BOT_ANSWER_GENERATION_TIMEOUT", "90")
)
# Number of docs to display in "Reference Documents"
DANSWER_BOT_NUM_DOCS_TO_DISPLAY = int(
    os.environ.get("DANSWER_BOT_NUM_DOCS_TO_DISPLAY", "5")
)
# If the LLM fails to answer, Danswer can still show the "Reference Documents"
DANSWER_BOT_DISABLE_DOCS_ONLY_ANSWER = os.environ.get(
    "DANSWER_BOT_DISABLE_DOCS_ONLY_ANSWER", ""
).lower() not in ["false", ""]
# When Danswer is considering a message, what emoji does it react with
DANSWER_REACT_EMOJI = os.environ.get("DANSWER_REACT_EMOJI") or "eyes"
# Should DanswerBot send an apology message if it's not able to find an answer
# That way the user isn't confused as to why DanswerBot reacted but then said nothing
# Off by default to be less intrusive (don't want to give a notif that just says we couldnt help)
NOTIFY_SLACKBOT_NO_ANSWER = (
    os.environ.get("NOTIFY_SLACKBOT_NO_ANSWER", "").lower() == "true"
)
# Mostly for debugging purposes but it's for explaining what went wrong
# if DanswerBot couldn't find an answer
DANSWER_BOT_DISPLAY_ERROR_MSGS = os.environ.get(
    "DANSWER_BOT_DISPLAY_ERROR_MSGS", ""
).lower() not in [
    "false",
    "",
]
# Default is only respond in channels that are included by a slack config set in the UI
DANSWER_BOT_RESPOND_EVERY_CHANNEL = (
    os.environ.get("DANSWER_BOT_RESPOND_EVERY_CHANNEL", "").lower() == "true"
)
# Auto detect query options like time cutoff or heavily favor recently updated docs
DISABLE_DANSWER_BOT_FILTER_DETECT = (
    os.environ.get("DISABLE_DANSWER_BOT_FILTER_DETECT", "").lower() == "true"
)
# Add a second LLM call post Answer to verify if the Answer is valid
# Throws out answers that don't directly or fully answer the user query
# This is the default for all DanswerBot channels unless the channel is configured individually
# Set/unset by "Hide Non Answers"
ENABLE_DANSWERBOT_REFLEXION = (
    os.environ.get("ENABLE_DANSWERBOT_REFLEXION", "").lower() == "true"
)
DANSWER_BOT_DISABLE_COT = (
    os.environ.get("DANSWER_BOT_DISABLE_COT", "").lower() == "true"
)
# Add the per document feedback blocks that affect the document rankings via boosting
ENABLE_SLACK_DOC_FEEDBACK = (
    os.environ.get("ENABLE_SLACK_DOC_FEEDBACK", "").lower() == "true"
)
