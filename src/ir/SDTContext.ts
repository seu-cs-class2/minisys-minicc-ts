import { ASTNode } from './AST'

interface YYContext {
  
}

export function newNode(yycontext: YYContext, name: string, ...args: ASTNode[]) {
  let root = new ASTNode()
  root.name = name
  if (args.length > 0) {
    root.left = args[0]
    root.line = args[0].line

    if (args.length === 1) {
      root.content = args[0].content
    } else {
      let ptr = 0
      for (let i = 1; i < args.length; i++, ptr++) {
        args[ptr].right = ptr + 1 < args.length ? args[ptr + 1] : null
      }
    }
  }
  else {

  }
}
