name="DtDTS"
if ! screen -list | grep -q $name; then
    #DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
    #cd $DIR
    screen -dmS $name
fi
screen -S $name -X stuff 'npm run startProd
'