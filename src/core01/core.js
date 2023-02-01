/**
 * 第1节
 * 本节的目的是迅速的实现一个最精简的语言的功能，让你了解一门计算机语言的骨架。
 * 知识点：
 * 1.递归下降的方法做词法分析；
 * 2.语义分析中的引用消解（找到函数的定义）；
 * 3.通过遍历AST的方法，执行程序。
 *
 * 本节采用的语法规则是极其精简的，只能定义函数和调用函数。定义函数的时候，还不能有参数。
 * prog = (functionDecl | functionCall)* ;
 * functionDecl: "function" Identifier "(" ")"  functionBody;
 * functionBody : '{' functionCall* '}' ;
 * functionCall : Identifier '(' parameterList? ')' ;
 * parameterList : StringLiteral (',' StringLiteral)* ;
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
// 一个Token数组，代表了下面这段程序做完词法分析后的结果：
/*
//一个函数的声明，这个函数很简单，只打印"Hello World!"
function sayHello(){
    println("Hello World!");
}
//调用刚才声明的函数
sayHello();
*/
var tokenArray = [
    { kind: TokenKind.Keyword, text: "function" },
    { kind: TokenKind.Identifier, text: "sayHello" },
    { kind: TokenKind.Seperator, text: "(" },
    { kind: TokenKind.Seperator, text: ")" },
    { kind: TokenKind.Seperator, text: "{" },
    { kind: TokenKind.Identifier, text: "println" },
    { kind: TokenKind.Seperator, text: "(" },
    { kind: TokenKind.StringLiteral, text: "Hello World!" },
    { kind: TokenKind.Seperator, text: ")" },
    { kind: TokenKind.Seperator, text: ";" },
    { kind: TokenKind.Seperator, text: "}" },
    { kind: TokenKind.Identifier, text: "sayHello" },
    { kind: TokenKind.Seperator, text: "(" },
    { kind: TokenKind.Seperator, text: ")" },
    { kind: TokenKind.Seperator, text: ";" },
    { kind: TokenKind.EOF, text: "" },
];
/**
 * 简化的词法分析器
 * 语法分析器从这里获取Token。
 */
var Tokenizer = /** @class */ (function () {
    function Tokenizer(tokens) {
        this.pos = 0;
        this.tokens = tokens;
    }
    Tokenizer.prototype.next = function () {
        if (this.pos <= this.tokens.length) {
            return this.tokens[this.pos++];
        }
        else {
            //如果已经到了末尾，总是返回EOF
            return this.tokens[this.pos];
        }
    };
    Tokenizer.prototype.position = function () {
        return this.pos;
    };
    Tokenizer.prototype.traceBack = function (newPos) {
        this.pos = newPos;
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
    Statement.isStatementNode = function (node) {
        if (!node) {
            return false;
        }
        else {
            return true;
        }
    };
    return Statement;
}(AstNode));
/**
 * 程序节点，也是AST的根节点
 */
var Prog = /** @class */ (function (_super) {
    __extends(Prog, _super);
    function Prog(stmts) {
        var _this = _super.call(this) || this;
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
    FunctionBody.isFunctionBodyNode = function (node) {
        if (!node) {
            return false;
        }
        if (Object.getPrototypeOf(node) == FunctionBody.prototype) {
            return true;
        }
        else {
            return false;
        }
    };
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
    FunctionCall.isFunctionCallNode = function (node) {
        if (!node) {
            return false;
        }
        if (Object.getPrototypeOf(node) == FunctionCall.prototype) {
            return true;
        }
        else {
            return false;
        }
    };
    FunctionCall.prototype.dump = function (prefix) {
        console.log(prefix +
            "FunctionCall " +
            this.name +
            (this.definition != null ? ", resolved" : ", not resolved"));
        this.parameters.forEach(function (x) {
            return console.log(prefix + "\t" + "Parameter: " + x);
        });
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
        while (true) {
            //每次循环解析一个语句
            //尝试一下函数声明
            stmt = this.parseFunctionDecl();
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            //如果前一个尝试不成功，那么再尝试一下函数调用
            stmt = this.parseFunctionCall();
            if (Statement.isStatementNode(stmt)) {
                stmts.push(stmt);
                continue;
            }
            //如果都没成功，那就结束
            if (stmt == null) {
                break;
            }
        }
        return new Prog(stmts);
    };
    /**
     * 解析函数声明
     * 语法规则：
     * functionDecl: "function" Identifier "(" ")"  functionBody;
     */
    Parser.prototype.parseFunctionDecl = function () {
        var oldPos = this.tokenizer.position();
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Keyword && t.text == "function") {
            t = this.tokenizer.next();
            if (t.kind == TokenKind.Identifier) {
                //读取"("和")"
                var t1 = this.tokenizer.next();
                if (t1.text == "(") {
                    var t2 = this.tokenizer.next();
                    if (t2.text == ")") {
                        var functionBody = this.parseFunctionBody();
                        if (FunctionBody.isFunctionBodyNode(functionBody)) {
                            //如果解析成功，从这里返回
                            return new FunctionDecl(t.text, functionBody);
                        }
                    }
                    else {
                        console.log("Expecting ')' in FunctionDecl, while we got a " + t.text);
                        return;
                    }
                }
                else {
                    console.log("Expecting '(' in FunctionDecl, while we got a " + t.text);
                    return;
                }
            }
        }
        //如果解析不成功，回溯，返回null。
        this.tokenizer.traceBack(oldPos);
        return null;
    };
    /**
     * 解析函数体
     * 语法规则：
     * functionBody : '{' functionCall* '}' ;
     */
    Parser.prototype.parseFunctionBody = function () {
        var oldPos = this.tokenizer.position();
        var stmts = [];
        var t = this.tokenizer.next();
        if (t.text == "{") {
            var functionCall = this.parseFunctionCall();
            while (FunctionCall.isFunctionCallNode(functionCall)) {
                //解析函数体
                stmts.push(functionCall);
                functionCall = this.parseFunctionCall();
            }
            t = this.tokenizer.next();
            if (t.text == "}") {
                return new FunctionBody(stmts);
            }
            else {
                console.log("Expecting '}' in FunctionBody, while we got a " + t.text);
                return;
            }
        }
        else {
            console.log("Expecting '{' in FunctionBody, while we got a " + t.text);
            return;
        }
        //如果解析不成功，回溯，返回null。
        this.tokenizer.traceBack(oldPos);
        return null;
    };
    /**
     * 解析函数调用
     * 语法规则：
     * functionCall : Identifier '(' parameterList? ')' ;
     * parameterList : StringLiteral (',' StringLiteral)* ;
     */
    Parser.prototype.parseFunctionCall = function () {
        var oldPos = this.tokenizer.position();
        var params = [];
        var t = this.tokenizer.next();
        if (t.kind == TokenKind.Identifier) {
            var t1 = this.tokenizer.next();
            if (t1.text == "(") {
                var t2 = this.tokenizer.next();
                //循环，读出所有
                while (t2.text != ")") {
                    if (t2.kind == TokenKind.StringLiteral) {
                        params.push(t2.text);
                    }
                    else {
                        console.log("Expecting parameter in FunctionCall, while we got a " + t2.text);
                        return; //出错时，就不在错误处回溯了。
                    }
                    t2 = this.tokenizer.next();
                    if (t2.text != ")") {
                        if (t2.text == ",") {
                            t2 = this.tokenizer.next();
                        }
                        else {
                            console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                            return;
                        }
                    }
                }
                //消化掉一个分号：;
                t2 = this.tokenizer.next();
                if (t2.text == ";") {
                    return new FunctionCall(t.text, params);
                }
                else {
                    console.log("Expecting a comma in FunctionCall, while we got a " + t2.text);
                    return;
                }
            }
        }
        //如果解析不成功，回溯，返回null。
        this.tokenizer.traceBack(oldPos);
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
            if (typeof x.body === "object") {
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
    AstVisitor.prototype.visitFunctionCall = function (functionCall) {
        return undefined;
    };
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
            if (typeof functionCall.parameters === "object") {
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
            if (functionCall.name != "println") {
                //系统内置函数不用报错
                console.log("Error: cannot find definition of function " + functionCall.name);
            }
        }
    };
    // 遍历prog中的所有语句，找到一个名称匹配的函数声明
    RefResolver.prototype.findFunctionDecl = function (prog, name) {
        for (var _i = 0, _a = prog === null || prog === void 0 ? void 0 : prog.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            var functionDecl = x;
            if (typeof functionDecl.body === "object" && functionDecl.name == name) {
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
            if (typeof functionCall.parameters === "object") {
                retVal = this.runFunction(functionCall);
            }
        }
        return retVal;
    };
    Intepretor.prototype.visitFunctionBody = function (functionBody) {
        var retVal;
        for (var _i = 0, _a = functionBody.stmts; _i < _a.length; _i++) {
            var x = _a[_i];
            retVal = this.runFunction(x);
        }
    };
    Intepretor.prototype.runFunction = function (functionCall) {
        if (functionCall.name == "println") {
            //内置函数
            if (functionCall.parameters.length > 0) {
                console.log(functionCall.parameters[0]);
            }
            else {
                console.log();
            }
            return 0;
        }
        else {
            //找到函数定义，继续遍历函数体
            if (functionCall.definition != null) {
                this.visitFunctionBody(functionCall.definition.body);
            }
        }
    };
    return Intepretor;
}(AstVisitor));
/////////////////////////////////////////////////////////////////////////
// 主程序
function compileAndRun() {
    //词法分析
    var tokenizer = new Tokenizer(tokenArray);
    console.log("\n程序所使用的Token:");
    for (var _i = 0, tokenArray_1 = tokenArray; _i < tokenArray_1.length; _i++) {
        var token = tokenArray_1[_i];
        console.log(JSON.stringify(token));
    }
    //语法分析
    var prog = new Parser(tokenizer).parseProg();
    console.log("\n语法分析后的AST:");
    prog.dump("");
    //语义分析
    new RefResolver().visitProg(prog);
    console.log("\n语义分析后的AST，注意自定义函数的调用已被消解:");
    prog.dump("");
    //运行程序
    console.log("\n运行当前的程序:");
    var retVal = new Intepretor().visitProg(prog);
    console.log("程序返回值：" + retVal);
}
//运行示例
compileAndRun();
