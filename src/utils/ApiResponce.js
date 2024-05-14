class ApiResponce{
    constructor(
        statusCode,
        code,
        message = "success"
    ){
        this.statusCode = statusCode
        this.code = code
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiResponce}