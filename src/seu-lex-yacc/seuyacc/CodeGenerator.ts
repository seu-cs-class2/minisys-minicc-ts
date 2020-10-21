/*
_____   _____   _____   _____    _____   _____       ___   _____   _____   _____  
|  _  \ | ____| |  _  \ |  _  \  | ____| /  ___|     /   | |_   _| | ____| |  _  \ 
| | | | | |__   | |_| | | |_| |  | |__   | |        / /| |   | |   | |__   | | | | 
| | | | |  __|  |  ___/ |  _  /  |  __|  | |       / / | |   | |   |  __|  | | | | 
| |_| | | |___  | |     | | \ \  | |___  | |___   / /  | |   | |   | |___  | |_| | 
|_____/ |_____| |_|     |_|  \_\ |_____| \_____| /_/   |_|   |_|   |_____| |_____/ 

*/

/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * 代码生成
 * by Withod
 * 2020-05 @ https://github.com/z0gSh1u/seu-lex-yacc
 */

import { YaccParser } from './YaccParser'
import { LR1Analyzer } from './LR1'
import { SpSymbol } from './Grammar'

function genPresetContent(analyzer: LR1Analyzer) {
  return `
  #include <stdio.h>
  #include <stdlib.h>
  #include <string.h>
  #include "yy.tab.h"
  #define STACK_LIMIT 1000
  #define SYMBOL_CHART_LIMIT 10000
  #define SYMBOL_ATTR_LIMIT 10000
  #define STATE_STACK_LIMIT 10000
  #define YACC_ERROR -1
  #define YACC_NOTHING -2
  #define YACC_ACCEPT -42
  ${genExceptions()}
  ${genExtern()}
  int stateStack[STACK_LIMIT];
  int stateStackSize = 0;
  int debugMode = 0;
  int EOFIndex = ${analyzer._getSymbolId(SpSymbol.END)};
  char *symbolAttr[SYMBOL_ATTR_LIMIT];
  int symbolAttrSize = 0;
  char *curAttr = NULL;
  char *curToken = NULL;
  FILE *treeout = NULL;
  int memoryAddrCnt = 0;
  ${genNode()}
  ${genFunctions()}
  `
}

function genExtern() {
  return `
  extern FILE *yyin;
  extern char yytext[];
  extern int yylex();
  extern FILE *yyout;
  `
}

function genNode() {
  return `
  struct Node {
    char *value;
    char *yytext;
    struct Node *children[SYMBOL_CHART_LIMIT];
    int childNum;
  }*nodes[SYMBOL_CHART_LIMIT];
  int nodeNum = 0;
  void reduceNode(int num) {
    struct Node *newNode = (struct Node *)malloc(sizeof(struct Node));
    char *nonterminal = curToken;
    if (nonterminal == NULL) nonterminal = curAttr;
    newNode->childNum = num;
    newNode->value = (char *)malloc(sizeof(char) * strlen(nonterminal));
    newNode->yytext = (char *)malloc(sizeof(char) * strlen(curAttr));
    strcpy(newNode->value, nonterminal);
    strcpy(newNode->yytext, curAttr);
    for (int i = 1; i <= num; i++) {
      newNode->children[num-i] = nodes[nodeNum-i];
      nodes[nodeNum-i] = NULL;
    }
    nodeNum = nodeNum - num;
    nodes[nodeNum++] = newNode;
  }
  `
}

function genFunctions() {
  return `
  void updateSymbolAttr(int popNum) {
    char *temp = (char *)malloc(sizeof(char) * strlen(curAttr));
    strcpy(temp, curAttr);
    while (popNum--) {
      if (symbolAttrSize == 0) throw(ArrayLowerBoundExceeded);
      free(symbolAttr[--symbolAttrSize]);
    }
    if (symbolAttrSize >= SYMBOL_ATTR_LIMIT) throw(ArrayUpperBoundExceeded);
    symbolAttr[symbolAttrSize] = (char *)malloc(strlen(temp) * sizeof(char));
    strcpy(symbolAttr[symbolAttrSize++], temp);
  }
  int stateStackPop(int popNum) {
    while (popNum--) {
      if (stateStackSize == 0) throw(ArrayLowerBoundExceeded);
      stateStackSize--;
    }
    if (stateStackSize == 0) return YACC_NOTHING;
    else return stateStack[stateStackSize - 1];
  }
  void stateStackPush(int state) {
    if (stateStackSize >= STATE_STACK_LIMIT) throw(ArrayUpperBoundExceeded);
    stateStack[stateStackSize++] = state;
  }
  void reduceTo(char *nonterminal) {
    if (curToken != NULL) {
      free(curToken);
      curToken = NULL;
    }
    curToken = (char *)malloc(strlen(nonterminal) * sizeof(char));
    strcpy(curToken, nonterminal);
  }
  `
}

function genDealWithFunction(analyzer: LR1Analyzer) {
  let code = `
  int dealWith(int symbol) {
    if (symbol == WHITESPACE) return YACC_NOTHING;
    if (stateStackSize < 1) throw(ArrayLowerBoundExceeded);
    if (debugMode) printf("Received symbol no.%d\\n", symbol);
    int state = stateStack[stateStackSize - 1];
    struct TableCell cell = table[state][symbol];
    switch(cell.action) {
      case 0:
        return YACC_NOTHING;
      case 4:
        return YACC_ACCEPT;
      case 1:
        if (debugMode) printf("Go to state %d\\n", cell.target);
        stateStackPush(cell.target);
        return YACC_NOTHING;
      case 2:
        stateStackPush(cell.target);
        if (debugMode) printf("Shift to state %d\\n", cell.target);
        curAttr = yytext;
        nodes[nodeNum] = (struct Node *)malloc(sizeof(struct Node));
        nodes[nodeNum]->value = (char *)malloc(sizeof(char) * strlen(curAttr));
        nodes[nodeNum]->yytext = NULL;
        strcpy(nodes[nodeNum]->value, curAttr);
        nodes[nodeNum]->childNum = 0;
        nodeNum++;
        updateSymbolAttr(0);
        return YACC_NOTHING;
      case 3:
        if (debugMode) printf("Reduce by producer %d\\n", cell.target);
        switch (cell.target) {
          `
  for (let index in analyzer.producers) {
    let producer = analyzer.producers[index]
    code += `case ${index}:
      curAttr = (char *)malloc(1024 * sizeof(char));
      memset(curAttr, '\\0', sizeof(curAttr));
      ${actionCodeModified(producer.action, producer.rhs.length)}
      stateStackPop(${producer.rhs.length});
      reduceNode(${producer.rhs.length});
      updateSymbolAttr(${producer.rhs.length});
      dealWith(${producer.lhs});
      return symbol;
    `
  }
  code += `
        }
      default:
        return symbol;
    }
    return YACC_NOTHING;
  }
  `
  return code
}

function genYaccParse(analyzer: LR1Analyzer) {
  return `
  int yyparse() {
    if (yyout == NULL) yyout = stdout;
    int token;
    stateStackPush(${analyzer.dfa.startStateId});
    while (token != YACC_ACCEPT && (token = yylex()) && token != YACC_ERROR) {
      do {
        token = dealWith(token);
        free(curToken);
        curToken = NULL;
      } while (token >= 0);
    }
    if (token == 0) {
      token = EOFIndex;
      do {
        token = dealWith(token);
      } while (token >= 0);
    }
    strcpy(yytext, curAttr);
    if (token == YACC_ERROR) return 1;
    if (token == YACC_ACCEPT) {
      treeout = fopen("yacc.tree", "w");
      printTree(nodes[0], 0);
      fclose(treeout);
      return 0;
    }
    else return 1;
  }
  `
}

/**
 * 生成语法分析器
 */
export function generateYTABC(yaccParser: YaccParser, analyzer: LR1Analyzer) {
  let finalCode = ''
  finalCode += genPresetContent(analyzer)
  finalCode += genTable(analyzer)
  finalCode += genDealWithFunction(analyzer)
  finalCode += genYaccParse(analyzer)
  finalCode += yaccParser.userCodePart
  return finalCode
}
