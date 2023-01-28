class LittleManStackMachine {

    status = "Ready"

    memory = []

    output = []
    
    outputFunction = (value) => {}

    registers = {
        program_counter:0,
        current_instruction:0,
        accumulator:0,
        stack_pointer:200,
        return_address_pointer:99
    }

    error = null

    inputCallback = function() {
        let returnVal = prompt("Please enter a number");
        return parseInt(returnVal);
    }

    compile(src) {
        let compiler = new FirthCompiler();
        let compileResult = compiler.compile(src);
        if (compileResult.errors.length > 0) {
            console.error("Compilation Errors:")
            for (const err of compileResult.errors) {
                console.error(err)
            }
            return "";
        } else {
            return compileResult.assembly;
        }
    }

    assemble(compiledAssembly) {
        let assembler = new LMSMAssembler();
        let assemblyResult = assembler.assemble(compiledAssembly);
        console.log(assemblyResult);
        return assemblyResult.machineCode;
    }

    compileAndRun(src) {
        let compiledAssembly = this.compile(src);
        let machine_code = this.assemble(compiledAssembly);
        this.load(machine_code);
        this.run();
    }

    assembleAndRun(src) {
        let machine_code = this.assemble(src);
        this.load(machine_code);
        this.run();
    }

    load(instructions) {
        this.memory = instructions;
    }

    step() {
        this.status = "Running";
        this.executeCurrentInstruction();
    }

    executeCurrentInstruction() {
        if (this.status !== "Stopped") {
            this.registers.current_instruction = this.memory[this.registers.program_counter];
            this.registers.program_counter++;
            this.executeInstruction(this.registers.current_instruction);
        }
        if (this.status === "Error") {
            console.error("Error : " + this.error);
        }
    }

    run() {
        this.status = "Running";
        while (this.status === "Running") {
            this.executeCurrentInstruction();
        }
    }

    executeInstruction(instruction) {
        if (instruction === 0) {
            this.status = "Stopped";
        } else if (100 <= instruction && instruction <= 199) {
            this.registers.accumulator += this.memory[instruction - 100];
        } else if (200 <= instruction && instruction <= 299) {
            this.registers.accumulator -= this.memory[instruction - 200];
        } else if (300 <= instruction && instruction <= 399) {
            this.memory[instruction - 300] = this.registers.accumulator;
        } else if (400 <= instruction && instruction <= 499) {
            this.registers.accumulator = instruction - 400;
        } else if (500 <= instruction && instruction <= 599) {
             this.registers.accumulator = this.memory[instruction - 500];
        } else if (600 <= instruction && instruction <= 699) {
            this.registers.program_counter = instruction - 600;
        } else if (700 <= instruction && instruction <= 799) {
            if (this.registers.accumulator === 0) {
                this.registers.program_counter = instruction - 700;
            }
        } else if (800 <= instruction && instruction <= 899) {
            if (this.registers.accumulator >= 0) {
                this.registers.program_counter = instruction - 800;
            }
        } else if (instruction === 901) {
            let value = this.inputCallback();
            this.registers.accumulator = value;
        } else if (instruction === 902) {
            console.log(this.registers.accumulator + " ");
            this.output.push(this.registers.accumulator);
            this.outputFunction(this.registers.accumulator);
        } else if (instruction === 910) {
            this.registers.return_address_pointer++;
            this.memory[this.registers.return_address_pointer] = this.registers.program_counter;
            this.registers.program_counter = this.memory[this.registers.stack_pointer];
            this.registers.stack_pointer++;
        } else if (instruction === 911) {
            this.registers.program_counter = this.memory[this.registers.return_address_pointer];
            this.registers.return_address_pointer--;
        } else if (instruction === 920) {
            this.registers.stack_pointer--;
            this.memory[this.registers.stack_pointer] = this.registers.accumulator;
        } else if (instruction === 921) {
            this.registers.accumulator = this.memory[this.registers.stack_pointer];
            this.registers.stack_pointer++;
        } else if (instruction === 922) {
            this.registers.stack_pointer--;
            this.memory[this.registers.stack_pointer] = this.memory[this.registers.stack_pointer + 1];
        } else if (instruction === 923) {
            this.registers.stack_pointer++;
        } else if (instruction === 924) {
            let tmpVal = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer] = this.memory[this.registers.stack_pointer + 1];
            this.memory[this.registers.stack_pointer + 1] = tmpVal;
        } else if (instruction === 930) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first + second;
            this.registers.stack_pointer++;
        } else if (instruction === 931) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first - second;
            this.registers.stack_pointer++;
        } else if (instruction === 932) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first * second;
            this.registers.stack_pointer++;
        } else if (instruction === 933) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first / second;
            this.registers.stack_pointer++;
        } else if (instruction === 934) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first > second ? first : second;
            this.registers.stack_pointer++;
        } else if (instruction === 935) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first < second ? first : second;
            this.registers.stack_pointer++;
        } else {
            this.status = "Stopped";
        }

        if (this.registers.stack_pointer < 100) {
            this.status = "Error";
            this.error = "Value Stack Overflow";
        }

        if (this.registers.stack_pointer <= this.registers.return_address_pointer) {
            this.status = "Error";
            this.error = "Stack Collision";
        }

        if (199 < this.registers.return_address_pointer) {
            this.status = "Error";
            this.error = "Stack Overflow";
        }

        if (this.registers.accumulator > 999) {
            this.registers.accumulator = 999;
        }
        if (this.registers.accumulator < -999) {
            this.registers.accumulator = -999;
        }
    }

}

class LMSMTokenizer {

    offset = 0
    line = 1
    lineOffset = 0
    tokens = []

    constructor(str) {
        this.str = str
    }

    consumeWhitespace() {
        while (this.hasMoreChars()) {
            if (this.atSpace()) {
                this.offset++;
                this.lineOffset++;
            }else if (this.atNewLine()) {
                this.offset++;
                this.line++;
                this.lineOffset = 0;
            } else {
                break;
            }
        }
    }

    hasMoreChars() {
        return this.offset < this.str.length;
    }

    atNewLine() {
        return this.currentChar() === "\n";
    }

    atSpace() {
        return this.currentChar() === " " || this.currentChar() === "\t";
    }

    currentChar() {
        return this.str[this.offset];
    }

    consumeChar() {
        let current = this.currentChar();
        this.offset++;
        return current;
    }

    consumeToken() {
        let token = {
            offset:this.offset,
            line:this.line,
            lineOffset: this.lineOffset,
            value: this.consumeChar()
        }
        while (this.hasMoreChars()) {
            if (this.atNewLine() || this.atSpace()) {
                break;
            }
            token.value += this.consumeChar()
        }
        this.tokens.push(token);
    }

    consumeComment() {
        if (this.currentChar() === "#") {
            while (this.hasMoreChars()) {
                if (this.atNewLine()) {
                    break;
                }
                this.consumeChar();
            }
            return true;
        }
    }

    tokenize() {
        this.consumeWhitespace();
        while (this.hasMoreChars()) {
            if (!this.consumeComment()) {
                this.consumeToken();
            }
            this.consumeWhitespace();
        }
        return this.tokens;
    }

}

class LMSMAssembler {

    SYNTHETIC_INSTRUCTION = -1;
    INSTRUCTIONS = {
        "ADD": 100,
        "SUB": 200,
        "STA": 300,
        "LDI": 400,
        "LDA": 500,
        "BRA": 600,
        "BRZ": 700,
        "BRP": 800,
        "INP": 901,
        "OUT": 902,
        "HLT": 0,
        "COB": 0,
        "DAT": this.SYNTHETIC_INSTRUCTION,
        "JAL": 910,
        "CALL": this.SYNTHETIC_INSTRUCTION,
        "RET": 911,
        "SPUSH": 920,
        "SPUSHI": this.SYNTHETIC_INSTRUCTION,
        "SPOP": 921,
        "SDUP": 922,
        "SDROP": 923,
        "SSWAP": 924,
        "SADD": 930,
        "SSUB": 931,
        "SMUL": 932,
        "SDIV": 933,
        "SMAX": 934,
        "SMIN": 935
    }

    ARG_INSTRUCTIONS = ["ADD", "SUB", "LDA", "STA", "BRA", "BRZ", "BRP", "DAT", "LDI", "CALL", "SPUSHI"]

    assemble(asmSource) {

        let lmsmTokenizer = new LMSMTokenizer(asmSource);
        let tokens = lmsmTokenizer.tokenize();
        let instructions = []
        let sourceMap = {}
        let labelsToInstructions = {}
        let offset = 0;

        while (tokens.length > 0) {
            let token = tokens.shift();
            let instruction = {offset:offset};

            // label
            if (this.INSTRUCTIONS[token.value] == null) {
                instruction.label = token.value;
                labelsToInstructions[instruction.label] = instruction;
                token = tokens.shift()
            }

            instruction.token = token;

            if (this.ARG_INSTRUCTIONS.includes(token.value)) {
                token = tokens.shift()
                instruction.arg = token;
            }

            instructions.push(instruction);

            if (instruction.token.value === "CALL") {
                offset = offset + 3;
            } else if (instruction.token.value === "SPUSHI") {
                offset = offset + 2;
            } else {
                offset++;
            }
        }

        let machineCode = []
        for (const instruction of instructions) {
            let resolvedArg = null;
            if(instruction.arg){
                if (isNaN(instruction.arg.value)) {
                    let targetInstruction = labelsToInstructions[instruction.arg.value];
                    if (targetInstruction == null) {
                        throw "Cannot find label " + instruction.arg.value;
                    }
                    resolvedArg = targetInstruction.offset;
                } else {
                    resolvedArg = parseInt(instruction.arg.value);
                }
            }

            let baseValue = this.INSTRUCTIONS[instruction.token.value];
            sourceMap[instruction.offset] = instruction.token.line;
            if (baseValue === this.SYNTHETIC_INSTRUCTION) {
                if (instruction.token.value === "DAT") {
                    machineCode[instruction.offset] = resolvedArg;
                } else if (instruction.token.value === "CALL") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;
                    machineCode[instruction.offset + 2] = 910;
                    sourceMap[instruction.offset + 1] = instruction.token.line;
                    sourceMap[instruction.offset + 2] = instruction.token.line;
                } else if (instruction.token.value === "SPUSHI") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;
                    sourceMap[instruction.offset + 1] = instruction.token.line;
                }
            } else {
                if (this.ARG_INSTRUCTIONS.includes(instruction.token.value)) {
                    machineCode[instruction.offset] = baseValue + resolvedArg;
                } else {
                    machineCode[instruction.offset] = baseValue;
                }
            }
        }
        return {
            originalSource: asmSource,
            sourceMap : sourceMap,
            machineCode : machineCode
        };
    }

}

class FirthCompiler {

    // variables for label generation
    conditional = 1;
    loop = 1;
    variable = 1;
    overflow = 1;

    // variable names
    variables = []

    // a loop stack so stop elements can resolve proper jump label
    loopStack = [];

    // literal number values that require named DAT slots to hold
    overflowValues = {};

    // statement terminators
    KEYWORDS = ["end", "loop", "else"];

    // basic operations in Firth
    OPS = {"+" : ["SADD"],
           "-" : ["SSUB"],
           "*" : ["SMUL"],
           "/" : ["SDIV"],
           "max" : ["SMAX"],
           "min" : ["SMIN"],
           "dup" : ["SDUP"],
           "swap" : ["SSWAP"],
           "pop" : ["SPOP"],
           "drop" : ["SDROP"],
           "return" : ["RET"],
           "get" : ["INP", "SPUSH"],
           "." : ["SDUP", "SPOP", "OUT"]}

    // syntax patterns
    FUNCTION_PATTERN = /^[a-zA-Z][a-zA-Z_]*\(\)$/
    VARIABLE_PATTERN = /^[a-zA-Z][a-zA-Z_]*$/
    VARIABLE_WRITE_PATTERN = /^[a-zA-Z][a-zA-Z_]*!$/

    compile(firthSource) {
        let lmsmTokenizer = new LMSMTokenizer(firthSource);
        this.tokens = lmsmTokenizer.tokenize();

        let rootElements = this.parseFirthProgram();

        let codeGenResult = this.codeGen(rootElements);

        let parseResult = {
            parsedElements: rootElements,
            sourceMap : codeGenResult.sourceMap,
            assembly : codeGenResult.getAssembly(),
            errors: this.collectErrors(rootElements),
            originalSource: firthSource,
        }

        console.log(parseResult);

        return parseResult
    }

    collectErrors(elements, errors) {
        if (elements) {
            errors ||= []
            for (const elt of elements) {
                if (elt.error) {
                    errors.push(elt.error);
                }
                this.collectErrors(elt.body, errors);
                this.collectErrors(elt.trueBranch, errors);
                this.collectErrors(elt.falseBranch, errors);
            }
            return errors;
        }
    }

    currentToken(){
        return this.tokens[0];
    }

    currentTokenValue(){
        if (this.tokens[0]) {
            return this.tokens[0].value;
        }
    }

    hasMoreTokens(){
        return this.tokens.length > 0;
    }

    takeToken(){
        return this.tokens.shift();
    }

    currentTokenIsANumber() {
        return !isNaN(this.tokens[0].value);
    }

    currentTokenIs(str) {
        return this.tokens[0] && this.tokens[0].value === str;
    }

    currentTokenMatches(regex) {
        return this.tokens[0] && this.tokens[0].value.match(regex);
    }

    currentTokenIsKeyword() {
        return this.KEYWORDS.includes(this.tokens[0]);
    }

    parseFunctionCall() {
        if (this.currentTokenMatches(this.FUNCTION_PATTERN)) {
            let token = this.takeToken();
            return {
                type: "FunctionCall",
                token:token,
                functionName: token.value,
            }
        }
    }

    parseInt() {
        if (this.currentTokenIsANumber()) {
            let token = this.takeToken();
            let numberLiteral = {
                type: "Number",
                token: token,
                value: parseInt(token.value),
            };
            if (numberLiteral.value < -999 || 999 < numberLiteral.value) {
                numberLiteral.error = "Numbers in Firth can only only be between -999 and 999";
            }
            return numberLiteral;
        }
    }

    parseOp() {
        if (this.OPS[this.currentTokenValue()]) {
            let token = this.takeToken();
            return {
                type: "Op",
                token: token,
                op: token.value,
            };
        }
    }

    parseFunctionDef() {
        if (this.currentTokenMatches("def")) {
            let defToken = this.takeToken();
            let nameToken = this.takeToken(); // take name as well
            let functionDef = {
                type: "FunctionDefinition",
                token: defToken,
                nameToken: nameToken,
                name: nameToken.value,
                body : [],
            };

            if (functionDef.name === null || !functionDef.name.match(this.FUNCTION_PATTERN)) {
                functionDef.error = "Function names must end with ()"
            }

            while (this.hasMoreTokens() && !this.currentTokenIs("end")) {
                functionDef.body.push(this.parseElement());
            }

            if (this.currentTokenIs("end")) {
                this.takeToken();
            } else {
                functionDef.error = "Expected 'end' to close function"
            }
            return functionDef;
        }
    }

    parseConditional() {
        if (this.currentTokenIs("zero?") ||
            this.currentTokenIs("positive?")) {
            let token = this.takeToken();

            let conditionalElt = {
                type: "Conditional",
                token: token,
                conditionType: token.value,
                conditionCount: this.conditional++,
                trueBranch : [],
                falseBranch : [],
            };

            while (this.hasMoreTokens() && !this.currentTokenIs("end") && !this.currentTokenIs("else")) {
                conditionalElt.trueBranch.push(this.parseElement());
            }

            if (this.currentTokenIs("else")) {
                this.takeToken(); // consume else
                while (this.hasMoreTokens() && !this.currentTokenIs("end")) {
                    conditionalElt.falseBranch.push(this.parseElement());
                }
            }

            if (this.currentTokenIs("end")) {
                this.takeToken();
            } else {
                conditionalElt.error = "Expected 'end' to close conditional"
            }
            return conditionalElt;
        }
    }

    parseStop() {
        if (this.currentTokenIs("stop")) {
            let currentLoop = this.loopStack[this.loopStack.length - 1];
            let stopLoop = {
                type: "Stop",
                token: this.takeToken(),
                loop: currentLoop
            };
            if (currentLoop == null) {
                stopLoop.error = "stop must appear inside a loop";
            }
            return stopLoop;
        }
    }

    parseLoop() {
        if (this.currentTokenIs("do")) {
            let loopElt = {
                loopCount : this.loop++,
                type: "Loop",
                token: this.takeToken(),
                body : [],
            };

            this.loopStack.push(loopElt);
            while (this.hasMoreTokens() && !this.currentTokenIs("loop")) {
                loopElt.body.push(this.parseElement());
            }
            this.loopStack.pop();

            if (this.currentTokenIs("loop")) {
                loopElt.loopToken = this.takeToken()
            } else {
                loopElt.error = "Expected 'loop' to close loop"
            }
            return loopElt;
        }
    }

    parseVariableDeclaration() {
        if (this.currentTokenIs("var")) {
            let varToken = this.takeToken();
            let nameToken = this.takeToken();
            let variableElt = {
                variableCount : this.variable++,
                type: "VariableDeclaration",
                token: varToken,
                nameToken: nameToken,
                name: nameToken ? nameToken.value : null,
            };

            this.variables.push(variableElt.name)

            if (variableElt.name == null || !variableElt.name.match(this.VARIABLE_PATTERN)) {
                variableElt.error = "Expected variable to have a name"
            }
            return variableElt;
        }
    }

    parseVariableRead() {
        if (this.currentTokenMatches(this.VARIABLE_PATTERN) && !this.currentTokenIsKeyword()) {
            let variableRead = {
                type: "VariableRead",
                token: this.takeToken(),
            };
            if (!this.variables.includes(variableRead.token.value)) {
                variableRead.error = "No variable named " + variableRead.token.value + " found!";
            }
            return variableRead;
        }
    }

    parseVariableWrite() {
        if (this.currentTokenMatches(this.VARIABLE_WRITE_PATTERN)) {
            return {
                type: "VariableWrite",
                token: this.takeToken(),
            }
        }
    }

    parseAssembly() {
        if (this.currentTokenIs("asm")) {
            let asmElt = {
                type: "Assembly",
                token: this.takeToken(),
                assembly: []
            };

            var line = null;
            while (this.hasMoreTokens() && !this.currentTokenIs("end")) {
                let currentToken = this.takeToken();
                if (line === null) {
                    line = currentToken.line
                } else if(line !== currentToken.line) {
                    line = currentToken.line;
                    asmElt.assembly.push(""); // pass newline through
                }
                asmElt.assembly.push(currentToken.value);
            }

            if (this.currentTokenIs("end")) {
                this.takeToken();
            } else {
                asmElt.error = "Expected 'end' to close asm"
            }
            return asmElt;
        }
    }

    parseElement() {
        let elt = this.parseInt();
        if (elt) {
            return elt;
        }

        let op = this.parseOp();
        if (op) {
            return op;
        }

        let conditional = this.parseConditional();
        if (conditional) {
            return conditional;
        }

        let call = this.parseFunctionCall();
        if (call) {
            return call;
        }

        let def = this.parseFunctionDef();
        if (def) {
            return def;
        }

        let loop = this.parseLoop();
        if (loop) {
            return loop;
        }

        let stop = this.parseStop();
        if (stop) {
            return stop;
        }

        let asm = this.parseAssembly();
        if (asm) {
            return asm;
        }

        let variableRead = this.parseVariableRead();
        if (variableRead) {
            return variableRead;
        }

        let variableWrite = this.parseVariableWrite();
        if (variableWrite) {
            return variableWrite;
        }

        let badVariableDeclaration = this.parseVariableDeclaration();
        if (badVariableDeclaration) {
            badVariableDeclaration.error = "Variables must be declared at the start of a Firth program"
            return badVariableDeclaration;
        }

        let token = this.takeToken();
        return {
            type: "ERROR",
            error: "Unknown token : " + token.value,
            token: token
        };
    }


    parseFirthProgram() {
        let program = [];

        // variables must come first
        let varDeclaration = this.parseVariableDeclaration();
        while (varDeclaration != null) {
            program.push(varDeclaration);
            varDeclaration = this.parseVariableDeclaration();
        }

        let restOfProgram = this.parseElements();
        for (const elt of restOfProgram) {
            program.push(elt);
        }
        return program;
    }

    parseElements() {
        let elements = [];
        while (this.hasMoreTokens()) {
            elements.push(this.parseElement());
        }
        return elements;
    }

    codeGenForElement(element, code) {
        if (element.type === "Number") {
            if (0 <= element.value && element.value <= 99) {
                code.add("SPUSHI " + element.value, element.token);
            } else {
                let overflowSlotLabel = "_OVERFLOW_" + this.overflow++;
                this.overflowValues[overflowSlotLabel] = element.value;
                code.add("LDA " + overflowSlotLabel, element.token);
                code.add("SPUSH", element.token);
            }
        } else if (element.type === "Op") {
            let opAssembly = this.OPS[element.op];
            for (const asm of opAssembly) {
                code.add(asm, element.token);
            }
        } else if (element.type === "FunctionCall") {
            code.add("CALL " + element.functionName, element.token);
        } else if (element.type === "FunctionDefinition") {
            code.labelNextInstruction(element.name);
            for (const elt of element.body) {
                this.codeGenForElement(elt, code);
            }
            // implicit return is last element of the body, if any
            code.add("RET");

        } else if (element.type === "Conditional") {
            let trueLabel = "COND_" + element.conditionCount;
            let endLabel = "END_COND_" + element.conditionCount;
            code.add("SPOP", element.token);
            if (element.conditionType === "zero?") {
                code.add("BRZ " + trueLabel);
            } else {
                code.add("BRP " + trueLabel);
            }
            if (element.falseBranch.length > 0) {
                for (const elt of element.falseBranch) {
                    this.codeGenForElement(elt, code);
                }
            }
            code.add("BRA " + endLabel);
            code.labelNextInstruction(trueLabel);
            if (element.trueBranch.length > 0) {
                for (const elt of element.trueBranch) {
                    this.codeGenForElement(elt, code);
                }
            } else {
                code.add("ADD ZERO");
            }
            code.labelNextInstruction(endLabel);
            code.add("ADD ZERO");
        } else if (element.type === "Loop") {
            let startLabel = "LOOP_" + element.loopCount;
            let endLabel = "END_LOOP_" + element.loopCount;
            code.labelNextInstruction(startLabel);
            for (const elt of element.body) {
                this.codeGenForElement(elt, code);
            }
            code.add("BRA " + startLabel, element.loopToken);
            code.labelNextInstruction(endLabel);
            code.add("ADD ZERO");
        } else if (element.type === "Stop") {
            code.add("BRA END_LOOP_" + element.loop.loopCount, element.token);
        } else if (element.type === "VariableRead") {
            code.add("LDA " + element.token.value, element.token);
        } else if (element.type === "VariableWrite") {
            let varName = element.token.value;
            let variableName = varName.substring(0, varName.length - 1);
            code.add("STA " + variableName, element.token);
        } else if (element.type === "VariableDeclaration") {
            code.add(element.name + " DAT 0");
        } else if (element.type === "Assembly") {
            code.add(element.assembly.join(" "), element.token);
        }
    }


    codeGen(elements) {
        let code = new FirthCodeGenerator();

        // generate non-functions&vars first
        for (const element of elements.filter(element => element.type !== "FunctionDefinition" && element.type !== "VariableDeclaration")) {
            this.codeGenForElement(element, code);
        }
        code.add("ZERO HLT"); // End program with a halt, labeled zero to support no-ops

        // generate functions second
        for (const element of elements.filter(element => element.type === "FunctionDefinition")) {
            this.codeGenForElement(element, code);
        }

        // allocated variable memory third
        for (const element of elements.filter(element => element.type === "VariableDeclaration")) {
            this.codeGenForElement(element, code);
        }

        // overflow literal values fourth
        for (const label in this.overflowValues) {
            code.add(label + " DAT " + this.overflowValues[label]);
        }

        return code
    }
}

/**
 * This is a simple class to collect ASM instructions and produce a map of ASM instruction lines to Firth program
 * lines.
 */
class FirthCodeGenerator {

    // generated assembly
    code = [];

    // map of source lines to firth program lines
    sourceMap = {};

    // label for next instruction
    label = null;

    // last line
    currentSourceLine = 0;

    labelNextInstruction(str) {
        if (this.label) {
            throw "Cannot label same instruction twice!";
        } else {
            this.label = str;
        }
    }

    add(instruction, token) {
        // consume the current label, if any
        if (this.label) {
            instruction = this.label + " " + instruction;
            this.label = null;
        }
        this.code.push(instruction);
        if (token) {
            this.currentSourceLine = token.line
        }
        this.sourceMap[this.code.length] = this.currentSourceLine;
    }

    getAssembly() {
        let s = this.code.join("\n");
        console.log(s)
        return s
    }
}