export class Expression extends Node {}

export class FunctionCall extends Expression {
  public functionName: string
  public args: Expression[]

  constructor(_functionName: string, _args: Expression[]) {
    super()
    this.functionName = _functionName
    this.args = _args
  }
}
