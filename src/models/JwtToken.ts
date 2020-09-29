/**
 * Wrapper for the jwt_decode result object.
 * TODO Expand for full functionality.
 */
class JwtToken {
    exp : number;
    cfor: string;

    constructor(_exp : number, _cfor : string) {
        this.exp = _exp;
        this.cfor = _cfor;
    }
}
