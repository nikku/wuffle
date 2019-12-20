# Export and import GitHub labels between projects by running bash script with jq and curl. Uses GitHub REST API. Requires personal access token.
# This script belongs to https://gist.github.com/douglascayers/9fbc6f2ad899f12030c31f428f912b5c

# This script uses the GitHub Labels REST API
# https://developer.github.com/v3/issues/labels/

# Provide a personal access token that can
# access the source and target repositories.
# This is how you authorize with the GitHub API.
# https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line
GH_TOKEN=

# The source repository whose labels to copy.
# SRC_GH_USER= organisation or user_name
SRC_GH_USER=user_name
SRC_GH_REPO=repo_name

# The target repository to add or update labels.
# TGT_GH_USER= organisation or user_name
TGT_GH_USER=user_name
TGT_GH_REPO=repo_name

# ---------------------------------------------------------

# Headers used in curl commands
GH_ACCEPT_HEADER="Accept: application/vnd.github.symmetra-preview+json"
GH_AUTH_HEADER="Authorization: Bearer $GH_TOKEN"

# Bash for-loop over JSON array with jq
# https://starkandwayne.com/blog/bash-for-loop-over-json-array-using-jq/
sourceLabelsJson64=$(curl --silent -H "$GH_ACCEPT_HEADER" -H "$GH_AUTH_HEADER" https://api.github.com/repos/${SRC_GH_USER}/${SRC_GH_REPO}/labels | jq '[ .[] | { "name": .name, "color": .color, "description": .description } ]' | jq -r '.[] | @base64' )

# for each label from source repo,
# invoke github api to create or update
# the label in the target repo
for sourceLabelJson64 in $sourceLabelsJson64; do

    # base64 decode the json
    sourceLabelJson=$(echo ${sourceLabelJson64} | base64 --decode | jq -r '.')

    # try to create the label
    # POST /repos/:owner/:repo/labels { name, color, description }
    # https://developer.github.com/v3/issues/labels/#create-a-label
    createLabelResponse=$(echo $sourceLabelJson | curl --silent -X POST -d @- -H "$GH_ACCEPT_HEADER" -H "$GH_AUTH_HEADER" https://api.github.com/repos/${TGT_GH_USER}/${TGT_GH_REPO}/labels)

    # if creation failed then the response doesn't include an id and jq returns 'null'
    createdLabelId=$(echo $createLabelResponse | jq -r '.id')

    # if label wasn't created maybe it's because it already exists, try to update it
    if [ "$createdLabelId" == "null" ]
    then
        updateLabelResponse=$(echo $sourceLabelJson | curl --silent -X PATCH -d @- -H "$GH_ACCEPT_HEADER" -H "$GH_AUTH_HEADER" https://api.github.com/repos/${TGT_GH_USER}/${TGT_GH_REPO}/labels/$(echo $sourceLabelJson | jq -r '.name | @uri'))
        echo "Update label response:\n"$updateLabelResponse"\n"
    else
        echo "Create label response:\n"$createLabelResponse"\n"
    fi

done