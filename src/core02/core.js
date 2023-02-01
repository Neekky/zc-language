"use strict";
/**
 * 第2节
 * 本节的知识点有两个：
 * 1.学会词法分析；
 * 2.升级语法分析为LL算法，因此需要知道如何使用First和Follow集合。
 *
 * 本节采用的词法规则是比较精简的，比如不考虑Unicode。
 * Identifier: [a-zA-Z_][a-zA-Z0-9_]* ;
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/////////////////////////////////////////////////////////////////////////
// 词法分析
// 本节没有提供词法分析器，直接提供了一个Token串。语法分析程序可以从Token串中依次读出
// 一个个Token，也可以重新定位Token串的当前读取位置。
//Token的类型
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Keyword"] = 0] = "Keyword";
    TokenKind[TokenKind["Identifier"] = 1] = "Identifier";
    TokenKind[TokenKind["StringLiteral"] = 2] = "StringLiteral";
    TokenKind[TokenKind["Seperator"] = 3] = "Seperator";
    TokenKind[TokenKind["Operator"] = 4] = "Operator";
    TokenKind[TokenKind["EOF"] = 5] = "EOF";
})(TokenKind || (TokenKind = {}));
;
/**
 * 一个字符串流。其操作为：
 * peek():预读下一个字符，但不移动指针；
 * next():读取下一个字符，并且移动指针；
 * eof():判断是否已经到了结尾。
 */
var CharStream = /** @class */ (function () {
    function CharStream(data) {
        this.pos = 0;
        this.line = 1;
        this.col = 0;
        this.data = data;
    }
    CharStream.prototype.peek = function () {
        return this.data.charAt(this.pos);
    };
    CharStream.prototype.next = function () {
        var ch = this.data.charAt(this.pos++);
        if (ch == '\n') {
            this.line++;
            this.col = 0;
        }
        else {
            this.col++;
        }
        return ch;
    };
    CharStream.prototype.eof = function () {
        return this.peek() == '';
    };
    return CharStream;
}());
/**
 * 词法分析器。
 * 词法分析器的接口像是一个流，词法解析是按需进行的。
 * 支持下面两个操作：
 * next(): 返回当前的Token，并移向下一个Token。
 * peek(): 返回当前的Token，但不移动当前位置。
 */
var Tokenizer = /** @class */ (function () {
    function Tokenizer(stream) {
        this.nextToken = { kind: TokenKind.EOF, text: "" };
        this.stream = stream;
    }
    Tokenizer.prototype.next = function () {
        //在第一次的时候，先parse一个Token
        if (this.nextToken.kind == TokenKind.EOF && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        var lastToken = this.nextToken;
        //往前走一个Token
        this.nextToken = this.getAToken();
        return lastToken;
    };
    Tokenizer.prototype.peek = function () {
        if (this.nextToken.kind == TokenKind.EOF && !this.stream.eof()) {
            this.nextToken = this.getAToken();
        }
        return this.nextToken;
    };
    //从字符串流中获取一个新Token。
    Tokenizer.prototype.getAToken = function () {
        this.skipWhiteSpaces();
        if (this.stream.eof()) {
            return { kind: TokenKind.EOF, text: "" };
        }
        else {
            var ch = this.stream.peek();
            if (this.isLetter(ch) || this.isDigit(ch)) {
                return this.parseIdentifer();
            }
            else if (ch == '"') {
                return this.parseStringLiteral();
            }
            else if (ch == '(' || ch == ')' || ch == '{' ||
                ch == '}' || ch == ';' || ch == ',') {
                this.stream.next();
                return { kind: TokenKind.Seperator, text: ch };
            }
            else if (ch == '/') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '*') {
                    this.skipMultipleLineComments();
                    return this.getAToken();
                }
                else if (ch1 == '/') {
                    this.skipSingleLineComment();
                    return this.getAToken();
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '/=' };
                }
                else {
                    return { kind: TokenKind.Operator, text: '/' };
                }
            }
            else if (ch == '+') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '+') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '++' };
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '+=' };
                }
                else {
                    return { kind: TokenKind.Operator, text: '+' };
                }
            }
            else if (ch == '-') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '-') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '--' };
                }
                else if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '-=' };
                }
                else {
                    return { kind: TokenKind.Operator, text: '-' };
                }
            }
            else if (ch == '*') {
                this.stream.next();
                var ch1 = this.stream.peek();
                if (ch1 == '=') {
                    this.stream.next();
                    return { kind: TokenKind.Operator, text: '*=' };
                }
                else {
                    return { kind: TokenKind.Operator, text: '*' };
                }
            }
            else {
                //暂时去掉不能识别的字符
                console.log("Unrecognized pattern meeting ': " + ch + "', at" + this.stream.line + " col: " + this.stream.col);
                this.stream.next();
                return this.getAToken();
            }
        }
    };
    /**
     * 跳过单行注释
     */
    Tokenizer.prototype.skipSingleLineComment = function () {
        //跳过第二个/，第一个之前已经跳过去了。
        this.stream.next();
        //往后一直找到回车或者eof
        while (this.stream.peek() != '\n' && !this.stream.eof()) {
            this.stream.next();
        }
    };
    /**
     * 跳过多行注释
     */
    Tokenizer.prototype.skipMultipleLineComments = function () {
        //跳过*，/之前已经跳过去了。
        this.stream.next();
        if (!this.stream.eof()) {
            var ch1 = this.stream.next();
            //往后一直找到回车或者eof
            while (!this.stream.eof()) {
                var ch2 = this.stream.next();
                if (ch1 == '*' && ch2 == '/') {
                    return;
                }
                ch1 = ch2;
            }
        }
        //如果没有匹配上，报错。
        console.log("Failed to find matching */ for multiple line comments at ': " + this.stream.line + " col: " + this.stream.col);
    };
    /**
     * 跳过空白字符
     */
    Tokenizer.prototype.skipWhiteSpaces = function () {
        while (this.isWhiteSpace(this.stream.peek())) {
            this.stream.next();
        }
    };
    /**
     * 字符串字面量。
     * 目前只支持双引号，并且不支持转义。
     */
    Tokenizer.prototype.parseStringLiteral = function () {
        var token = { kind: TokenKind.StringLiteral, text: "" };
        //第一个字符不用判断，因为在调用者那里已经判断过了
        this.stream.next();
        while (!this.stream.eof() && this.stream.peek() != '"') {
            token.text += this.stream.next();
        }
        if (this.stream.peek() == '"') {
            //消化掉字符换末尾的引号
            this.stream.next();
        }
        else {
            console.log("Expecting an \" at line: " + this.stream.line + " col: " + this.stream.col);
        }
        return token;
    };
    /**
     * 解析标识符。从标识符中还要挑出关键字。
     */
    Tokenizer.prototype.parseIdentifer = function () {
        var token = { kind: TokenKind.Identifier, text: "" };
        //第一个字符不用判断，因为在调用者那里已经判断过了
        token.text += this.stream.next();
        //读入后序字符
        while (!this.stream.eof() &&
            this.isLetterDigitOrUnderScore(this.stream.peek())) {
            token.text += this.stream.next();
        }
        //识别出关键字
        if (token.text == 'function') {
            token.kind = TokenKind.Keyword;
        }
        return token;
    };
    Tokenizer.prototype.isLetterDigitOrUnderScore = function (ch) {
        return (ch >= 'A' && ch <= 'Z' ||
            ch >= 'a' && ch <= 'z' ||
            ch >= '0' && ch <= '9' ||
            ch == '_');
    };
    Tokenizer.prototype.isLetter = function (ch) {
        return (ch >= 'A' && ch <= 'Z' || ch >= 'a' && ch <= 'z');
    };
    Tokenizer.prototype.isDigit = function (ch) {
        return (ch >= '0' && ch <= '9');
    };
    Tokenizer.prototype.isWhiteSpace = function (ch) {
        return (ch == ' ' || ch == '\n' || ch == '\t');
    };
    return Tokenizer;
}());
/////////////////////////////////////////////////////////////////////////
// 语法分析
// 包括了AST的数据结构和递归下降的语法解析程序
/**
 * 基类
 */
var AstNode = /** @class */ (function () {
    function AstNode() {
    }
    return AstNode;
}());
/**
 * 语句
 * 其子类包括函数声明和函数调用
 */
var Statement = /** @class */ (function (_super) {
    __extends(Statement, _super);
    function Statement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Statement;
}(AstNode));
/**
 * 程序节点，也是AST的根节点
 */
var Prog = /** @class */ (function (_super) {
    __extends(Prog, _super);
    function Prog(stmts) {
        var _this = _super.call(this) || this;
        _this.stmts = []; //程序中可以包含多个语句
        _this.stmts = stmts;
        return _this;
    }
    Prog.prototype.dump = function (prefix) {
        console.log(prefix + "Prog");
        this.stmts.forEach(function (x) { return x.dump(prefix + "\t"); });
    };
    return Prog;
}(AstNode));
/**
 * 函数声明节点
 */
var FunctionDecl = /** @class */ (function (_super) {
    __extends(FunctionDecl, _super);
    function FunctionDecl(name, body) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.body = body;
        return _this;
    }
    FunctionDecl.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionDecl " + this.name);
        this.body.dump(prefix + "\t");
    };
    return FunctionDecl;
}(Statement));
/**
 * 函数体
 */
var FunctionBody = /** @class */ (function (_super) {
    __extends(FunctionBody, _super);
    function FunctionBody(stmts) {
        var _this = _super.call(this) || this;
        _this.stmts = stmts;
        return _this;
    }
    FunctionBody.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionBody");
        this.stmts.forEach(function (x) { return x.dump(prefix + "\t"); });
    };
    return FunctionBody;
}(AstNode));
/**
 * 函数调用
 */
var FunctionCall = /** @class */ (function (_super) {
    __extends(FunctionCall, _super);
    function FunctionCall(name, parameters) {
        var _this = _super.call(this) || this;
        _this.definition = null; //指向函数的声明
        _this.name = name;
        _this.parameters = parameters;
        return _this;
    }
    FunctionCall.prototype.dump = function (prefix) {
        console.log(prefix + "FunctionCall " + this.name + (this.definition != null ? ", resolved" : ", not resolved"));
        this.parameters.forEach(function (x) { return console.log(prefix + "\t" + "Parameter: " + x); });
    };
    return FunctionCall;
}(Statement));
var Parser = /** @class */ (function () {
    function Parser(tokenizer) {
        this.tokenizer = tokenizer;
    }
    /**
     * 解析Prog
     * 语法规则：
     * prog = (functionDecl | functionCall)* ;
     */
    Parser.prototype.parseProg = function () {
        var stmts = [];
        var stmt = null;
        var token = this.tokenizer.peek();
        while (token.kind != TokenKind.EOF) {
            if (token.kind == TokenKind.Keyword && token.text == 'function') {
                stmt = this.parseFunctionDecl();
            }
            else if (token.kind == TokenKind.Identifier) {
                stmt = this.parseFunctionCall();
            }
            if (stmt != null) {
                stmts.push(stmt);
                console.log("success");
            }
            else {
                //console.log("Unrecognized token: ");
                // console.log(token);
            }
            token = this.tokenizer.peek();
        }
        return new Prog(stmts);
    };
    /**
     * 解析函数声明
     * 语法规则：
     * functionDecl: "function" Identifier "(" ")"  functionBody;
     * 返回值：
     * null-意味着解析过程出错。
     */
    Parser.prototype.parseFunctionDecl = function () {
        console.log("in FunctionDecl");
        //跳过关键字'function'
        this.tokenizer.next();
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            //读取()
            var t1 = this.tokenizer.next();
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                if (t2.text == ")") {
                    var functionBody = this.parseFunctionBody();
                    if (functionBody != null) {
                        //如果解析成功，从这里返回
                        return new FunctionDecl(t.text, functionBody);
                    }
                    else {
                        console.log("Error parsing FunctionBody in FunctionDecl");
                        return null;
                    }
                }
                else {
                    console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                    return null;
                }
            }
            else {
                console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Expecting a function name, while we got a " + t.text);
            return null;
        }
        return null;
    };
    /**
     * 解析函数体
     * 语法规则：
     * functionBody : '{' functionCall* '}' ;
     */
    Parser.prototype.parseFunctionBody = function () {
        var stmts = [];
        var t = this.tokenizer.next();
        if (t.text == "{") {
            while (this.tokenizer.peek().kind == TokenKind.Identifier) {
                var functionCall = this.parseFunctionCall();
                if (functionCall != null) {
                    stmts.push(functionCall);
                }
                else {
                    console.log("Error parsing a FunctionCall in FunctionBody.");
                    return null;
                }
            }
            t = this.tokenizer.next();
            if (t.text == "}") {
                return new FunctionBody(stmts);
            }
            else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return null;
            }
        }
        else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return null;
        }
        return null;
    };
    /**
     * 解析函数调用
     * 语法规则：
     * functionCall : Identifier '(' parameterList? ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    Parser.prototype.parseFunctionCall = function () {
        var params = [];
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            var t1 = this.tokenizer.next();
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                //循环，读出所有参数
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return null;
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return null;
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                }
                else {
                    console.log("Expecting a semicolon in FunctionCall, while we got a " + t2.text);
                    return null;
                }
            }
        }
        return null;
    };
    return Parser;
}());
/**
 * 对AST做遍历的Vistor。
 * 这是一个基类，定义了缺省的遍历方式。子类可以覆盖某些方法，修改遍历方式。
 */
var AstVisitor = /** @class */ (function () {
    function AstVisitor() {
    }
    AstVisitor.prototype.visitProg = function (prog) {
        var retVal;
        for (var _i = 0, _a = prog.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            if (typeof x.body === 'object') {
                retVal = this.visitFunctionDecl(x);
            }
            else {
                retVal = this.visitFunctionCall(x);
            }
        }
        return retVal;
    };
    AstVisitor.prototype.visitFunctionDecl = function (functionDecl) {
        return this.visitFunctionBody(functionDecl.body);
    };
    AstVisitor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.visitFunctionCall(x);
        }
        return retVal;
    };
    AstVisitor.prototype.visitFunctionCall = function (functionCall) { return undefined; };
    return AstVisitor;
}());
/////////////////////////////////////////////////////////////////////////
// 语义分析
// 对函数调用做引用消解，也就是找到函数的声明。
/**
 * 遍历AST。如果发现函数调用，就去找它的定义。
 */
var RefResolver = /** @class */ (function (_super) {
    __extends(RefResolver, _super);
    function RefResolver() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.prog = null;
        return _this;
    }
    RefResolver.prototype.visitProg = function (prog) {
        this.prog = prog;
        for (var _i = 0, _a = prog.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                this.resolveFunctionCall(prog, functionCall);
            }
            else {
                this.visitFunctionDecl(x);
            }
        }
    };
    RefResolver.prototype.visitFunctionBody = function (functionBody) {
        if (this.prog != null) {
            for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
                var x = _a[_i];
                return this.resolveFunctionCall(this.prog, x);
            }
        }
    };
    RefResolver.prototype.resolveFunctionCall = function (prog, functionCall) {
        var functionDecl = this.findFunctionDecl(prog, functionCall.name);
        if (functionDecl != null) {
            functionCall.definition = functionDecl;
        }
        else {
            if (functionCall.name != "println") { //系统内置函数不用报错
                console.log("Error: cannot find definition of function " + functionCall.name);
            }
        }
    };
    RefResolver.prototype.findFunctionDecl = function (prog, name) {
        for (var _i = 0, _a = prog === null || prog === void 0 ? void 0 : prog.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionDecl = x;
            if (typeof functionDecl.body === 'object' &&
                functionDecl.name == name) {
                return functionDecl;
            }
        }
        return null;
    };
    return RefResolver;
}(AstVisitor));
/////////////////////////////////////////////////////////////////////////
// 解释器
/**
 * 遍历AST，执行函数调用。
 */
var Intepretor = /** @class */ (function (_super) {
    __extends(Intepretor, _super);
    function Intepretor() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Intepretor.prototype.visitProg = function (prog) {
        var retVal;
        for (var _i = 0, _a = prog.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionCall = x;
            if (typeof functionCall.parameters === 'object') {
                retVal = this.runFunction(functionCall);
            }
        }
        ;
        return retVal;
    };
    Intepretor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.runFunction(x);
        }
        ;
    };
    Intepretor.prototype.runFunction = function (functionCall) {
        if (functionCall.name == "println") { //内置函数
            if (functionCall.parameters.length > 0) {
                console.log(functionCall.parameters[0]);
            }
            else {
                console.log();
            }
            return 0;
        }
        else { //找到函数定义，继续遍历函数体
            if (functionCall.definition != null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    };
    return Intepretor;
}(AstVisitor));
/////////////////////////////////////////////////////////////////////////
// 主程序
function compileAndRun(program) {
    //源代码
    console.log("源代码:");
    console.log(program);
    //词法分析
    console.log("\n词法分析结果:");
    var tokenizer = new Tokenizer(new CharStream(program));
    while (tokenizer.peek().kind != TokenKind.EOF) {
        console.log(tokenizer.next());
    }
    tokenizer = new Tokenizer(new CharStream(program)); //重置tokenizer,回到开头。
    //语法分析
    var prog = new Parser(tokenizer).parseProg();
    console.log("\n语法分析后的AST:");
    prog.dump("");
    //语义分析
    new RefResolver().visitProg(prog);
    console.log("\n语法分析后的AST，注意自定义函数的调用已被消解:");
    prog.dump("");
    //运行程序
    console.log("\n运行当前的程序:");
    var retVal = new Intepretor().visitProg(prog);
    console.log("程序返回值：" + retVal);
}
//处理命令行参数，从文件里读取源代码
var process = require("process");
// 要求命令行的第三个参数，一定是一个文件名。
if (process.argv.length < 3) {
    console.log('Usage: node ' + process.argv[1] + ' FILENAME');
    process.exit(1);
}
// 读取源代码
var fs = require('fs');
var filename = process.argv[2];
fs.readFile(filename, 'utf8', function (err, data) {
    if (err)
        throw err;
    compileAndRun(data);
});
