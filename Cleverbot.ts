import * as http from 'https'
import * as cb from "Cleverbot";

class Cleverbot{
    private endpoint : string;
    private config : cb.Config = {
        apiKey:  ""
    };
    private CleverbotState : cb.CleverbotState;

    constructor(apiKey : string ){
        if (apiKey.length !== 27)
            //
            throw new SyntaxError(`${apiKey} is not a valid Cleverbot API key`);
        this.config.apiKey = apiKey;
        this.endpoint= 'https://www.cleverbot.com/getreply?key=' + this.config.apiKey;
        // the first cs request actually does return us a reply
    }

    private get encodedEmotion() : string {
        if (!this.config.emotion){
            return "";
        }
        return '&cb_settings_tweak1=' + this.config.emotion;
    }
    private get encodedEngagement() : string {
        if (!this.config.engagement){
            return "";
        }
        return '&cb_settings_tweak2=' + this.config.engagement;
    }
    private get encodedRegard() : string {
        if (!this.config.regard){
            return "";
        }
        return '&cb_settings_tweak3=' + this.config.regard;
    }

    private get encodedCleverbotState() : string {
        return '&cs=' + this.CleverbotState
    }

    private static encodeInput(input : string) : string {
        return '&input=' + input;
    }

    private async retrieveCleverbotState() : Promise<cb.CleverbotState>  {
        const _this = this;
        let response : cb.APIResponse;
        console.log(this.endpoint);
        return new Promise<cb.CleverbotState>(function (resolve, reject) {
            http.get(_this.endpoint, (res : any) => {
                let final : any;
                res.on('data', (d:string) => {
                    final += d;
                    console.log(final);
                });

                res.on('end', () => {
                    response = JSON.parse(final);
                    console.log('cs=' + final);
                    resolve(response.cs);
                });

                res.on('error', (error : Error) => {
                    reject(error);
                });
            });
        })
    }

    private setCleverbotState() : Promise<cb.CleverbotState>{
        const that = this;
        return new Promise<cb.CleverbotState>(function (resolve, reject) {
            that.retrieveCleverbotState().then(async(cs : cb.CleverbotState)=> {
                that.CleverbotState = cs;
                resolve(cs);
            });
        })
    }

    public say(message : string, verbose ?: boolean) : Promise<cb.APIResponse|string> {
        let that = this;
        let endpoint : string = this.endpoint;
        endpoint += Cleverbot.encodeInput(message);
        /*
        if (this.CleverbotState == null) {
            console.log("cleverbot state is fked");
            this.setCleverbotState().then(state => {
                this.CleverbotState = state;
            });
        }
        */
        endpoint += this.encodedCleverbotState;

        if (this.config.emotion) endpoint += '&' + this.config.emotion;
        if (this.config.engagement) endpoint += '&' + this.config.engagement;
        if (this.config.regard) endpoint += '&' + this.config.regard;

        let response : cb.APIResponse;
        console.log(endpoint);
        return new Promise<cb.APIResponse|string>(function (resolve, reject) {
            http.get(endpoint, (res : any )=> {
                let final : any = "";
                res.on('data', (d:string) => {
                    final += d;
                });

                res.on('end', () => {
                    response = JSON.parse(final);

                    if (!verbose)
                        resolve(response.output);
                    else
                        resolve(response);
                    if (that.CleverbotState === null){
                        that.CleverbotState = response.cs;
                    }
                });

                res.on('error', (error : Error) => {
                    reject(error);
                });
            })
        });
    }

    public setEmotion(amount : number){
        this.config.emotion = amount;
    }

    public setEngagement(amount : number) : void {
        if (amount < 0 || amount > 100) throw new RangeError(`Engagement must be a value between 0 and 100.`);
        this.config.emotion = amount;
    }

    public setRegard(amount : number){
        this.config.emotion = amount;
    }
}

export default Cleverbot