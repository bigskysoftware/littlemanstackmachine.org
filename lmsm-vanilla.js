class LittleManStackMachine {

    status = "Ready"

    memory = []

    output = []

    registers = {
        program_counter:0,
        current_instruction:0,
        accumulator:0,
        stack_pointer:200,
        return_address_pointer:99
    }

    error = null

    getProgramCounter() {
        return this.registers.program_counter;
    }
    setProgramCounter(value) {
        this.registers.program_counter = value;
    }
    getAccumulator() {
        return this.registers.accumulator;
    }
    setAccumulator(value) {
        this.registers.accumulator = value;
    }

    getCurrentInstruction() {
        return this.registers.current_instruction;
    }
    
    setCurrentInstruction(value) {
        this.registers.current_instruction = value;
    }

    getStackPointer() {
        return this.registers.stack_pointer;
    }
    setStackPointer(value) {
        this.registers.stack_pointer = value;
    }
    getReturnAddressPointer() {
        return this.registers.return_address_pointer;
    }
    setReturnAddressPointer(value) {
        this.registers.return_address_pointer = value;
    }
    getMemory(position) {
        return this.memory[position];
    }
    setMemory(position, value) {
        this.memory[position] = value;
    }

    inputCallback = function() {
        let returnVal = prompt("Please enter a number");
        return parseInt(returnVal);
    }

    compile(src) {
        let compiler = new FirthCompiler();
        let compiledAssembly = compiler.compile(src);
        return compiledAssembly;
    }

    assemble(compiledAssembly) {
        let assembler = new LMSMAssembler();
        let machine_code = assembler.assemble(compiledAssembly);
        return machine_code;
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
            this.setCurrentInstruction(this.getMemory(this.getProgramCounter()));
            this.setProgramCounter(this.getProgramCounter + 1);
            this.executeInstruction(this.getCurrentInstruction());
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
            this.setAccumulator(this.getAccumulator() + this.getMemory[instruction - 100]);
        } else if (200 <= instruction && instruction <= 299) {
            this.setAccumulator(this.getAccumulator() - this.getMemory[instruction - 200]);
        } else if (300 <= instruction && instruction <= 399) {
            this.setMemory(instruction - 300, this.getAccumulator());
        } else if (400 <= instruction && instruction <= 499) {
            this.setAccumulator(instruction - 400);
        } else if (500 <= instruction && instruction <= 599) {
             this.setAccumulator(this.getMemory(instruction - 500));
        } else if (600 <= instruction && instruction <= 699) {
            this.setProgramCounter(instruction - 600);
        } else if (700 <= instruction && instruction <= 799) {
            if (this.getAccumulator() === 0) {
                this.setProgramCounter(instruction - 700);
            }
        } else if (800 <= instruction && instruction <= 899) {
            if (this.getAccumulator() >= 0) {
                this.setProgramCounter(instruction - 800);
            }
        } else if (instruction === 901) {
            let value = this.inputCallback();
            this.setAccumulator(value);
        } else if (instruction === 902) {
            console.log(this.getAccumulator() + " ");
            this.output.push(this.getAccumulator());
        } else if (instruction === 910) {
            this.setReturnAddressPointer(this.getReturnAddressPointer() + 1);
            this.setMemory(this.getReturnAddressPointer(), this.getProgramCounter());
            this.setProgramCounter(this.getMemory(this.getStackPointer()));
            this.setStackPointer(this.getStackPointer() + 1);
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
            if (baseValue === this.SYNTHETIC_INSTRUCTION) {
                if (instruction.token.value === "DAT") {
                    machineCode[instruction.offset] = resolvedArg;
                } else if (instruction.token.value === "CALL") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;
                    machineCode[instruction.offset + 2] = 910;

                } else if (instruction.token.value === "SPUSHI") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;

                }
            } else {
                if (this.ARG_INSTRUCTIONS.includes(instruction.token.value)) {
                    machineCode[instruction.offset] = baseValue + resolvedArg;
                } else {
                    machineCode[instruction.offset] = baseValue;
                }
            }
        }
        return machineCode;
    }

}

class FirthCompiler {

    // variables for label generation
    conditional = 1;
    loop = 1;
    variable = 1;
    overflow = 1;

    // loop stack so stop elements can resolve jump
    loopStack = [];

    // literal number values that require named DAT slots to hold
    overflowValues = {};

    // statement terminators
    KEYWORDS = ["end", "loop", "else"];


    // basic operations in Firth
    OPS = {"+" : "SADD",
           "-" : "SSUB",
           "*" : "SMUL",
           "/" : "SDIV",
           "max" : "SMAX",
           "min" : "SMIN",
           "dup" : "SDUP",
           "swap" : "SSWAP",
           "pop" : "SPOP",
           "drop" : "SDROP",
           "return" : "RET",
           "get" : "INP\nSPUSH",
           "." : "SDUP\nSPOP\nOUT"}

    // syntax patterns
    FUNCTION_PATTERN = /^[a-zA-Z][a-zA-Z_]+\(\)$/
    VARIABLE_PATTERN = /^[a-zA-Z][a-zA-Z_]+$/
    VARIABLE_WRITE_PATTERN = /^[a-zA-Z][a-zA-Z_]+!$/

    compile(firthSource) {
        let lmsmTokenizer = new LMSMTokenizer(firthSource);
        this.tokens = lmsmTokenizer.tokenize();
        let rootElements = this.parseFirthProgram();
        let assembly = this.codeGen(rootElements);
        return assembly
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
            return {
                type: "Number",
                token: token,
                value: parseInt(token.value),
            }
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
                this.takeToken()
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

            if (variableElt.name == null || !variableElt.name.match(this.VARIABLE_PATTERN)) {
                variableElt.error = "Expected variable to have a name"
            }
            return variableElt;
        }
    }

    parseVariableRead() {
        if (this.currentTokenMatches(this.VARIABLE_PATTERN) && !this.currentTokenIsKeyword()) {
            return {
                type: "VariableRead",
                token: this.takeToken(),
            }
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
                    asmElt.assembly.push("\n"); // pass newline through
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

        return {
            type: "ERROR",
            message: "Unknown token : " + this.takeToken()
        };
    }


    parseFirthProgram() {
        let program = [];
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
                code.push("SPUSHI " + element.value + "\n");
            } else {
                let overflowSlotLabel = "_OVERFLOW_" + this.overflow++;
                this.overflowValues[overflowSlotLabel] = element.value;
                code.push("LDA " + overflowSlotLabel + "\n");
                code.push("SPUSH\n");
            }
        } else if (element.type === "Op") {
            code.push(this.OPS[element.op] + "\n");
        } else if (element.type === "FunctionCall") {
            code.push("CALL " + element.functionName + "\n");
        } else if (element.type === "FunctionDefinition") {
            code.push(element.name + " ");
            for (const elt of element.body) {
                this.codeGenForElement(elt, code);
            }
            code.push("RET\n");
        } else if (element.type === "Conditional") {
            let trueLabel = "COND_" + element.conditionCount;
            let endLabel = "END_COND_" + element.conditionCount;
            code.push("SPOP\n")
            if (element.conditionType === "zero?") {
                code.push("BRZ ");
            } else {
                code.push("BRP ");
            }
            code.push(trueLabel + "\n");
            if (element.falseBranch.length > 0) {
                for (const elt of element.falseBranch) {
                    this.codeGenForElement(elt, code);
                }
            }
            code.push("BRA " + endLabel + "\n");

            code.push(trueLabel + " ")
            if (element.trueBranch.length > 0) {
                for (const elt of element.trueBranch) {
                    this.codeGenForElement(elt, code);
                }
            } else {
                code.push("ADD ZERO\n");
            }
            code.push(endLabel + " ADD ZERO\n");
        } else if (element.type === "Loop") {
            let startLabel = "LOOP_" + element.loopCount;
            let endLabel = "END_LOOP_" + element.loopCount;
            code.push(startLabel + " ");
            for (const elt of element.body) {
                this.codeGenForElement(elt, code);
            }
            code.push("BRA " + startLabel + "\n");
            code.push(endLabel + " ADD ZERO\n");
        } else if (element.type === "Stop") {
            code.push("BRA END_LOOP_" + element.loop.loopCount + "\n");
        } else if (element.type === "VariableRead") {
            code.push("LDA " + element.token.value + "\n");
        } else if (element.type === "VariableWrite") {
            let varName = element.token.value;
            let variableName = varName.substring(0, varName.length - 1);
            code.push("STA " + variableName + "\n");
        } else if (element.type === "VariableDeclaration") {
            code.push(element.name + " DAT 0\n");
        } else if (element.type === "Assembly") {
            code.push(element.assembly.join(" ") + "\n");
        }
    }

    codeGen(elements) {
        let code = [];

        // generate non-functions first
        for (const element of elements.filter(element => element.type !== "FunctionDefinition" && element.type !== "VariableDeclaration")) {
            this.codeGenForElement(element, code);
        }
        code.push("ZERO HLT\n"); // End program with a halt, labeled zero to support no-ops

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
            code.push(label + " DAT " + this.overflowValues[label]);
        }

        let s = code.join("");
        console.log(s);
        return s;
    }
}
