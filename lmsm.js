/**
 * This is the main emulator of the LittleManStackMachine.
 */
class LittleManStackMachine {

    // The status of the machine, "Ready", "Error", etc.
    status = "Ready"

    // The memory of the machine, implicitly of size 200
    memory = []

    // The output buffer of the machine
    output = []

    // This is the register file for the machine, with a total of five registers
    registers = {
        program_counter:0,         // this register points to the next instruction in memory to execute
        current_instruction:0,     // this register holds the value of the current instruction
        accumulator:0,             // this register is the sole general purpose register
        stack_pointer:200,         // this register points to the memory location of the top of the value stack
        return_address_pointer:99  // this register points to the memory location of the top of the return address stack
    }

    // This holds an error message if the machine is in the error state, reporting what happened
    error = null

    // This callback is called when input is needed from the user.  It should return an integer.
    inputCallback = function() {
        let returnVal = prompt("Please enter a number");
        return parseInt(returnVal);
    }

    // This callback is called when an output is emitted by the emulator.
    outputCallback = (value) => {}

    // This callback is called when the emulator is updated.
    updateCallback = () => {}

    // A helper method to compile Firth source all the way into loaded machine instructions in the emulator
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

    // A helper method to assemble LMSM assemebly source into loaded machine instructions in the emulator
    assemble(compiledAssembly) {
        let assembler = new LMSMAssembler();
        let assemblyResult = assembler.assemble(compiledAssembly);
        console.log(assemblyResult);
        return assemblyResult.machineCode;
    }

    // Compiles the given Firth source and runs it on the emulator
    compileAndRun(src) {
        let compiledAssembly = this.compile(src);
        let machine_code = this.assemble(compiledAssembly);
        this.load(machine_code);
        this.run();
    }

    // Assembles the given LMSM assembly source and runs it on the emulator
    assembleAndRun(src) {
        let machine_code = this.assemble(src);
        this.load(machine_code);
        this.run();
    }

    // Loads the given machine instructions into memory
    load(instructions) {
        this.memory = instructions;
    }

    // Executes a single instruction
    step() {
        this.status = "Running";
        this.executeCurrentInstruction();
    }

    // Executes the current instruction if the machine is runnable
    executeCurrentInstruction() {
        if (this.status !== "Stopped") {
            this.registers.current_instruction = this.memory[this.registers.program_counter];
            this.registers.program_counter++;
            this.executeInstruction(this.registers.current_instruction);
        }
        if (this.status === "Error") {
            console.error("Error : " + this.error);
        }
        this.updateCallback()
    }

    // Runs the machine, executing until an error occurs or the program halts
    run() {
        this.status = "Running";
        while (this.status === "Running") {
            this.executeCurrentInstruction();
        }
    }

    /**
     * This is the crux of the emulator, which is responsible for interpreting a given instruction and updating
     * the state of the machine accordingly.  LMSM Machine Code is very simple: it uses decimal values rather than
     * binary to make it easier to understand what's going on.  But this is the same general algorithm as an emulator
     * for a more sophisticated CPU.
     *
     * @param instruction
     */
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
            this.output.push(this.registers.accumulator);
            this.outputCallback(this.registers.accumulator);
        } else if (instruction === 910) {
            // layout: var0, var1, ... varN, N, return address | N = frameSize
            let frame_size = this.memory[this.registers.stack_pointer + 1];
            this.registers.return_address_pointer += frame_size + 2;
            this.memory[this.registers.return_address_pointer - 1] = frame_size;
            this.memory[this.registers.return_address_pointer] = this.registers.program_counter;
            this.registers.program_counter = this.memory[this.registers.stack_pointer];
            this.registers.stack_pointer += 2;
        } else if (instruction === 911) {
            this.registers.program_counter = this.memory[this.registers.return_address_pointer];
            let frame_size = this.memory[this.registers.return_address_pointer - 1];
            this.registers.return_address_pointer -= frame_size + 2;
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
        } else if (instruction === 936) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first % second;
            this.registers.stack_pointer++;
        } else if (instruction === 937) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first === second ? 1 : 0;
            this.registers.stack_pointer++;
        } else if (instruction === 938) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first < second ? 1 : 0;
            this.registers.stack_pointer++;
        } else if (instruction === 939) {
            let first = this.memory[this.registers.stack_pointer + 1];
            let second = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer + 1] = first > second ? 1 : 0;
            this.registers.stack_pointer++;
        } else if (instruction === 940) {
            let first = this.memory[this.registers.stack_pointer];
            this.memory[this.registers.stack_pointer] = first === 0 ? 1 : 0;
        } else if (instruction === 941) {
            let first = this.memory[this.registers.stack_pointer];
            let slot = this.registers.accumulator;
            this.registers.stack_pointer++;
            this.memory[this.registers.return_address_pointer - 2 - slot] = first;
        } else if (instruction === 942) {
            let slot = this.registers.accumulator;
            this.registers.accumulator = this.memory[this.registers.return_address_pointer - 2 - slot];
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
            } else if (this.atNewLine()) {
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
        this.lineOffset++;
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
        token.lineOffsetEnd = this.lineOffset;
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
        "SMIN": 935,
        "SREM": 936,
        "SEQ": 937,
        "SGT": 939,
        "SLT": 938,
        "SNOT": 940,
        "FST": 941,
        "FLD": 942,
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
                    errors.push(
                        {
                            token: elt.token,
                            message: elt.error
                        }
                    );
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
            let token = this.takeToken();
            let variableWrite = {
                type: "VariableWrite",
                token: token,
                name: token.value.substring(0, token.value.length - 1)
            };
            if (!this.variables.includes(variableWrite.name)) {
                variableWrite.error = "No variable named " + variableWrite.name + " found!";
            }
            return variableWrite
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
            code.add("SPUSHI 0", element.token); // firth functions always have 0 arguments
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
            code.add("SPUSH", element.token);
        } else if (element.type === "VariableWrite") {
            let variableName = element.name;
            code.add("SPOP", element.token);
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


class SeaCompiler {
    static TYPES = ["int", "void"];
    static KEYWORDS = ["return", "extern", "if", "while", "else", "for"];
    static TOKEN_TYPE = {
        IDENT: "Identifier",
        KEYWORD: "Keyword",
        TYPE: "Type",
        PUNCT: "Punctuation",
        INT: "Integer",
        OP: "Operator",
        ERROR: "Error",
    };
    tokenize(input) {
        const operators = ['+', '-', '*', '/', '<=', '>=', '==', '!=', '<', '>', '='];
        const punctuations = ['(', ')', '{', '}', ';', ','];
        const isAlpha = char => /[a-zA-Z]/.test(char);
        const isAlphaNumeric = char => char !== undefined && /[a-zA-Z0-9_]/.test(char);
        const isNumeric = char => /[0-9]/.test(char);

        const tokens = [];
        let line = 1;
        let lineOffset = 0;
        let index = 0;

        function addToken(type, value) {
            tokens.push({
                type,
                value,
                line,
                lineOffset,
                index,
            });
            index += value.length;
            lineOffset += value.length;
        }

        while (index < input.length) {
            const char = input[index];

            if (char === ' ' || char === '\t' || char === '\r') {
                index++;
                lineOffset++;
            } else if (char === '\n') {
                index++;
                line++;
                lineOffset = 0;
            } else if (operators.some(op => input.startsWith(op, index))) {
                let op = operators.find(op => input.startsWith(op, index));
                addToken(SeaCompiler.TOKEN_TYPE.OP, op);
            } else if (punctuations.includes(char)) {
                addToken(SeaCompiler.TOKEN_TYPE.PUNCT, char);
            } else if (isAlpha(char)) {
                let identifier = char;
                for (let offset = 1; isAlphaNumeric(input[index + offset]); offset++) {
                    identifier += input[index + offset];
                }

                if (SeaCompiler.KEYWORDS.includes(identifier)) {
                    addToken(SeaCompiler.TOKEN_TYPE.KEYWORD, identifier);
                } else if (SeaCompiler.TYPES.includes(identifier)) {
                    addToken(SeaCompiler.TOKEN_TYPE.TYPE, identifier);
                } else {
                    addToken(SeaCompiler.TOKEN_TYPE.IDENT, identifier);
                }
            } else if (isNumeric(char)) {
                let number = char;
                for (let offset = 1; isNumeric(input[index + offset]); offset++) {
                    number += input[index + offset];
                }
                addToken(SeaCompiler.TOKEN_TYPE.INT, number);
            } else {
                addToken(SeaCompiler.TOKEN_TYPE.ERROR, char);
            }
        }

        return tokens;
    }

    static ELEMENT_TYPE = {
        DEF_EXTERN: "extern_def",
        DEF_FUNCTION: "function_def",
        BLOCK: "block",

        STMT_VAR: "variable_stmt",
        STMT_RETURN: "return_stmt",
        STMT_IF: "if_stmt",
        STMT_FOR: "for_stmt",
        STMT_WHILE: "while_stmt",
        STMT_EXPR: "expr_stmt",

        EXPR_INT: "expr_int",
        EXPR_IDENT: "expr_ident",
        EXPR_GLOBAL_IDENT: "expr_global_ident",
        EXPR_INVOKE: "expr_invoke",
        EXPR_BINOP: "expr_binop",
        EXPR_ASSIGN: "expr_assign",
        EXPR_ASSIGN_GLOBAL: "expr_assign_global",
    }
    parse(tokens) {
        let index = 0;
        let currentToken = tokens[index];

        let ast = {
            functions: {},
            externs: {},
            globals: {},
            errors: [],
            scope: {
                maxLocals: 0,
                numLocals: 0,
                slotBindings: {},
                frames: [],
                push: function push() {
                    this.frames.push({});
                },
                pop: function pop() {
                    let frame = this.frames.pop();
                    this.maxLocals = Math.max(this.maxLocals, this.numLocals);
                    this.numLocals -= Object.keys(frame).length;
                },
                isDefined: function isDefined(name) {
                    return name && this.frames.some(frame => frame[name]);
                },
                define: function define(name, type) {
                    if (name.value) {
                        if (this.frames.length) {
                            this.frames[this.frames.length - 1][name.value] = type;
                            let slot = this.numLocals++;
                            this.slotBindings[name.value] = slot;
                            return slot;
                        } else {
                            ast.globals[name.value] = type;
                        }
                    } else {
                        return error("Cannot define variable with no name!", name);
                    }
                },
                reset: function reset() {
                    this.maxLocals = 0;
                    this.slotBindings = {};
                    this.numLocals = 0;
                    this.frames = [];
                },
                getSlot: function getSlot(name) {
                    return this.slotBindings[name];
                },
            },
            isDefined: function isDefined(name) {
                return name && (this.scope.isDefined(name)
                    || this.functions[name] || this.externs[name] || this.globals[name]);
            },
            hasVar: function hasVar(name) {
                return name && (this.globals[name] || this.scope.isDefined(name));
            },
            getFunc: function getFunc(name) {
                return this.functions[name] || this.externs[name];
            }
        }

        function consume() {
            if (currentToken) {
                let token = currentToken;
                currentToken = tokens[++index];
                return token;
            }
        }

        function expect(value) {
            if (currentToken && currentToken.value === value) {
                return consume();
            } else {
                return error(`Expected '${value}'`);
            }
        }

        function more() {
            return index < tokens.length;
        }

        function peek(value, n) {
            if (n) {
                return tokens[index + n] && tokens[index + n].value === value;
            } else {
                return currentToken && currentToken.value === value;
            }
        }

        function take(value) {
            if (peek(value)) {
                consume();
                return true;
            } else {
                return false;
            }
        }

        function peekType(value, n) {
            if (n) {
                return tokens[index + n] && tokens[index + n].type === value;
            } else {
                return currentToken && currentToken.type === value;
            }
        }

        function error(message, token) {
            if (!token) {
                if (currentToken) token = consume();
                else token = tokens[tokens.length - 1] || { line: 0, col: 0 };
            }
            let error = { token, message };
            ast.errors.push(error);
            return error;
        }

        function parseProgram() {
            while (currentToken) {
                if (peek('extern')) {
                    let extern = parseExtern();

                    const VALID_EXTERNS = {
                        "get": {returns: "int", parameters: []},
                        "put": {returns: "void", parameters: ["int"]},
                    };

                    if (ast.isDefined(extern.functionName.value)) {
                        error(`symbol '${extern.functionName.value}' already defined`, extern.functionName);
                    } else if (!VALID_EXTERNS[extern.functionName.value]) {
                        error(`invalid extern function '${extern.functionName.value}'`, extern.functionName);
                    } else {
                        let def = VALID_EXTERNS[extern.functionName.value];
                        if (def.returns !== extern.returnType.value) {
                            error(`extern function '${extern.functionName.value}' returns '${extern.returnType}' but should return '${def.returns}'`, extern.returnType);
                        } else if (def.parameters.length !== extern.parameters.length) {
                            error(`extern function '${extern.functionName.value}' expects these parameters: ${def.parameters.join(", ")}`, extern.functionName);
                        } else if (def.parameters.some((param, idx) => param !== extern.parameters[idx].type.value)) {
                            error(`extern function '${extern.functionName.value}' expects these parameters: ${def.parameters.join(", ")}`, extern.functionName);
                        } else {
                            ast.externs[extern.functionName.value] = extern;
                        }
                    }
                } else if (peek('(', 2)) { // {index + 0:ret} {index + 1:name} {index + 2:'('}
                    let func = parseFunction();
                    if (ast.isDefined(func.functionName.value)) {
                        return error(`symbol '${func.functionName.value}' already defined`, func.functionName);
                    } else {
                        ast.functions[func.functionName.value] = func;
                    }
                } else {
                    let item = parseVarStmt();
                    for (const { name, value } of item.items) {
                        ast.globals[name.value] = value;
                    }
                }
            }
        }

        function parseExtern() {
            expect('extern');
            const returnType = parseType();
            const functionName = parseIdent();

            expect('(');
            const parameters = [];
            while (more() && !peek(')')) {
                let type = parseType();
                parameters.push({ type });

                if (!take(',')) {
                    break;
                }
            }
            expect(')');
            expect(';');

            return {
                type: SeaCompiler.ELEMENT_TYPE.DEF_EXTERN,
                returnType,
                functionName,
                parameters,
            };
        }

        function parseFunction() {
            ast.scope.reset();
            const returnType = parseType();
            const functionName = parseIdent();
            expect('(');
            const parameters = [];

            ast.scope.push();
            while (more() && !peek(')')) {
                let type = parseType();
                let name = parseIdent();

                if (ast.isDefined(name.value)) {
                    error(`Parameter '${name}' already defined`, name);
                }

                let slot = ast.scope.define(name, type.value);

                parameters.push({ name, type, slot });

                if (!take(',')) {
                    break;
                }
            }
            expect(')');

            let body = parseBlock();
            ast.scope.pop();

            return {
                type: SeaCompiler.ELEMENT_TYPE.DEF_FUNCTION,
                maxLocals: ast.scope.maxLocals,
                slotBindings: ast.scope.slotBindings,
                functionName,
                returnType,
                parameters,
                body,
            };
        }

        function parseLiteralExpr() {
            if (peekType(SeaCompiler.TOKEN_TYPE.INT)) {
                let token = consume();
                const value = parseInt(token.value);
                return { type: SeaCompiler.ELEMENT_TYPE.EXPR_INT, value, token };
            } else if (peekType(SeaCompiler.TOKEN_TYPE.IDENT)) {
                let token = consume();
                if (!ast.hasVar(token.value)) {
                    return error(`Undefined symbol '${token.value}'`, token);
                }

                if (ast.globals[token.value]) {
                    return { type: SeaCompiler.ELEMENT_TYPE.EXPR_GLOBAL_IDENT, value: token.value, token };
                } else {
                    let slot = ast.scope.getSlot(token.value);
                    return { type: SeaCompiler.ELEMENT_TYPE.EXPR_IDENT, value: token.value, token, slot };
                }
            } else {
                let token = consume();
                return error(`Expected literal but found '${token.value}'`, token);
            }
        }

        function parseInvokeExpr() {
            if (peekType(SeaCompiler.TOKEN_TYPE.IDENT) && peek('(', 1)) {
                let functionName = consume();
                expect('(');
                let args = [];
                while (more() && !peek(')')) {
                    args.push(parseExpr());
                    if (!take(',')) {
                        break;
                    }
                }
                expect(')');
                return {
                    type: SeaCompiler.ELEMENT_TYPE.EXPR_INVOKE,
                    functionName,
                    args,
                };
            } else {
                return parseLiteralExpr();
            }
        }

        function parseProductExpr() {
            let left = parseInvokeExpr();
            while (peek('*') || peek('/')) {
                const operator = consume().value;
                const right = parseInvokeExpr();
                left = { type: SeaCompiler.ELEMENT_TYPE.EXPR_BINOP, operator: operator, left: left, right: right };
            }
            return left;
        }

        function parseTermExpr() {
            let left = parseProductExpr();
            while (peek('+') || peek('-')) {
                const operator = consume().value;
                const right = parseProductExpr();
                left = { type: SeaCompiler.ELEMENT_TYPE.EXPR_BINOP, operator: operator, left: left, right: right };
            }
            return left;
        }

        function parseCmpExpr() {
            let left = parseTermExpr();
            while (peek('<') || peek('>') || peek('<=') || peek('>=')) {
                const operator = consume().value;
                const right = parseTermExpr();
                left = { type: SeaCompiler.ELEMENT_TYPE.EXPR_BINOP, operator: operator, left: left, right: right };
            }
            return left;
        }

        function parseEqExpr() {
            let left = parseCmpExpr();
            while (peek('==') || peek('!=')) {
                const operator = consume().value;
                const right = parseCmpExpr();
                left = { type: SeaCompiler.ELEMENT_TYPE.EXPR_BINOP, operator: operator, left: left, right: right };
            }
            return left;
        }

        function parseAssignExpr() {
            if (peekType(SeaCompiler.TOKEN_TYPE.IDENT) && peek('=', 1)) {
                let name = parseIdent();
                expect('=');
                let value = parseEqExpr();
                if (!ast.hasVar(name.value)) {
                    return error(`symbol '${name.value}' is not defined`, name);
                }
                if (ast.globals[name.value]) {
                    return { type: SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN_GLOBAL, name, value };
                } else {
                    let slot = ast.scope.getSlot(name.value);
                    return { type: SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN, slot, name, value };
                }
            } else {
                return parseEqExpr();
            }
        }

        function parseType() {
            if (peekType(SeaCompiler.TOKEN_TYPE.TYPE)) {
                return consume();
            } else {
                return error(`Expected 'int' or 'void'`);
            }
        }

        function parseIdent() {
            if (peekType(SeaCompiler.TOKEN_TYPE.IDENT)) {
                let ident = currentToken;
                consume();
                return ident;
            } else {
                return error(`Expected identifier`);
            }
        }

        function parseExpr() {
            return parseAssignExpr();
        }

        function parseBlock() {
            expect('{');

            let statements = [];
            while (more() && !peek('}')) {
                statements.push(parseStmt());
            }

            expect('}');
            return { type: SeaCompiler.ELEMENT_TYPE.BLOCK, statements };
        }

        function parseVarStmt() {
            const type = parseType();
            let items = [];
            do {
                const name = parseIdent();
                let value;
                if (take('=')) value = parseExpr();

                if (ast.isDefined(name.value)) {
                    error(`symbol '${name.value}' already defined`, name);
                }
                let slot = ast.scope.define(name, type.value);
                items.push({ name, value, slot });
            } while (take(','));
            expect(';');
            return { type: SeaCompiler.ELEMENT_TYPE.STMT_VAR, varType: type, items };
        }

        function parseReturnStmt() {
            expect('return');
            let value;
            if (!peek(';')) {
                value = parseExpr();
            }
            expect(';');
            return { type: SeaCompiler.ELEMENT_TYPE.STMT_RETURN, value: value };
        }

        function parseIfStmt() {
            let token = expect('if');
            expect('(');
            let condition = parseExpr();
            expect(')');

            let stmt = {
                type: SeaCompiler.ELEMENT_TYPE.STMT_IF,
                token,
                condition,
            };

            ast.scope.push();
            if (peek('{')) {
                stmt.body = parseBlock();
            } else {
                stmt.body = parseStmt();
            }
            ast.scope.pop();

            while (peek('else')) {
                let token = consume();
                if (take('if')) {
                    expect('(');
                    let condition = parseExpr();
                    expect(')');

                    let elseIf = {
                        type: SeaCompiler.ELEMENT_TYPE.STMT_IF,
                        token,
                        condition,
                    }

                    ast.scope.push();
                    if (peek('{')) {
                        elseIf.body = parseBlock();
                    } else {
                        elseIf.body = parseStmt();
                    }
                    ast.scope.pop();

                    stmt.elseBranch = elseIf;
                } else {
                    ast.scope.push();
                    if (peek('{')) {
                        stmt.elseBranch = parseBlock();
                    } else {
                        stmt.elseBranch = parseStmt();
                    }
                    ast.scope.pop();
                    break;
                }
            }

            return stmt;
        }

        function parseForStmt() {
            expect('for');
            expect('(');

            ast.scope.push();
            let decl;
            if (peekType(SeaCompiler.TOKEN_TYPE.TYPE)) decl = parseVarStmt();
            else {
                if (!peek(';')) decl = parseExpr();
                expect(';');
            }

            let condition;
            if (!peek(';')) condition = parseExpr();
            expect(';');

            let incr;
            if (!peek(')')) incr = parseExpr();
            expect(')');

            let body;
            if (peek('{')) {
                body = parseBlock();
            } else {
                body = parseExpr();
                expect(';');
            }
            ast.scope.pop();

            return {
                type: SeaCompiler.ELEMENT_TYPE.STMT_FOR,
                decl,
                condition,
                incr,
                body,
            };
        }

        function parseWhileStmt() {
            let token = expect('while');
            expect('(');
            let condition = parseExpr();
            expect(')');
            let body;
            if (peek('{')) {
                body = parseBlock();
            } else {
                body = parseExpr();
                expect(';');
            }
            return {
                type: SeaCompiler.ELEMENT_TYPE.STMT_WHILE,
                token,
                condition,
                body,
            }
        }

        function parseStmt() {
            let stmt;
            if (SeaCompiler.TYPES.includes(currentToken.value)) {
                stmt = parseVarStmt();
            } else if (peek('return')) {
                stmt = parseReturnStmt();
            } else if (peek('if')) {
                stmt = parseIfStmt();
            } else if (peek('for')) {
                stmt = parseForStmt();
            } else if (peek('while')) {
                stmt = parseWhileStmt();
            } else {
                let expr = parseExpr();
                stmt = {
                    type: SeaCompiler.ELEMENT_TYPE.STMT_EXPR,
                    expr,
                };
                expect(';');
            }
            return stmt;
        }

        parseProgram();
        delete ast.scope; // scope will always be empty at this point, no point in keeping it around
        return ast;
    }

    codeGen(ast) {
        let code = new FirthCodeGenerator();
        let overflow = 0;
        let overflowValues = {};
        let condCount = 0;
        let loopCount = 0;

        function codeGenForElement(element) {
            function defFunction() {
                code.labelNextInstruction(element.functionName.value);
                for (const param of element.parameters) {
                    code.add("LDI " + param.slot, param.name);
                    code.add("FST", param.name);
                }
                codeGenForElement(element.body);
            }
            function block() {
                for (const stmt of element.statements) {
                    codeGenForElement(stmt);
                }
            }
            function stmtVar() {
                for (const { name, value, slot } of element.items) {
                    if (value) {
                        codeGenForElement(value);
                        code.add("LDI " + slot, name);
                        code.add("FST", name);
                    }
                }
            }
            function stmtReturn() {
                if (element.value) codeGenForElement(element.value);
                code.add("RET");
            }
            function stmtIf() {
                let false_label = "COND_" + condCount;
                let end_label = "END_" + condCount;
                condCount++;

                codeGenForElement(element.condition);
                code.add("SPOP", element.token);
                code.add("BRZ " + false_label, element.token);

                codeGenForElement(element.body);
                code.add("BRA " + end_label, element.token);

                code.labelNextInstruction(false_label)
                if (element.elseBranch) {
                    codeGenForElement(element.elseBranch);
                }
                code.add("BRA " + end_label, element.elseBranch?.token || element.token);

                code.labelNextInstruction(end_label);
            }
            function stmtFor() {
                if (element.decl) codeGenForElement(element.decl);

                let loopId = loopCount++;
                let bodyLabel = "FOR_BODY_" + loopId;
                let endLabel = "FOR_END_" + loopId;

                code.labelNextInstruction(bodyLabel);
                if (element.condition) {
                    codeGenForElement(element.condition);
                    code.add("SPOP", element.condition.token);
                    code.add("BRZ " + endLabel, element.condition.token);
                }

                codeGenForElement(element.body);

                if (element.incr) codeGenForElement(element.incr);
                code.add("BRA " + bodyLabel, element.token);

                code.labelNextInstruction(endLabel);
            }
            function stmtWhile() {
                let loopId = loopCount++;
                let bodyLabel = "WHILE_BODY_" + loopId;
                let endLabel = "WHILE_END_" + loopId;

                code.labelNextInstruction(bodyLabel);
                codeGenForElement(element.condition);
                code.add("SPOP", element.condition.token);
                code.add("BRZ " + endLabel, element.condition.token);

                codeGenForElement(element.body);
                code.add("BRA " + bodyLabel, element.token);

                code.labelNextInstruction(endLabel);
            }
            function stmtExpr() {
                codeGenForElement(element.expr);
                if (element.expr.type === SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN || element.expr.type === SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN_GLOBAL) {
                    // no-op
                } else if (element.expr.type === SeaCompiler.ELEMENT_TYPE.EXPR_INVOKE && ast.getFunc(element.expr.functionName.value).returnType === "int") {
                    code.add("SDROP", element.expr.functionName);
                } else {
                    code.add("SDROP", element.expr.token);
                }
            }
            function exprInt() {
                if (0 <= element.value && element.value <= 99) {
                    code.add("SPUSHI " + element.value, element.token);
                } else {
                    let overflowSlotLabel = "!_OVERFLOW_" + overflow++;
                    overflowValues[overflowSlotLabel] = element.value;
                    code.add("LDA " + overflowSlotLabel, element.token);
                    code.add("SPUSH", element.token);
                }
            }
            function exprIdent() {
                code.add("LDI " + element.slot, element.token);
                code.add("FLD", element.token);
                code.add("SPUSH", element.token);
            }
            function exprGlobalIdent() {
                code.add("LDA " + element.value, element.token);
                code.add("SPUSH", element.token);
            }
            function exprInvoke() {
                for (const arg of element.args) {
                    codeGenForElement(arg);
                }
                if (element.functionName.value === "get") {
                    code.add("INP", element.functionName);
                    code.add("SPUSH")
                } else if (element.functionName.value === "put") {
                    code.add("SPOP", element.functionName);
                    code.add("OUT", element.functionName);
                } else {
                    let func = ast.functions[element.functionName.value];
                    code.add("SPUSHI " + func.maxLocals, element.functionName);
                    code.add("CALL " + element.functionName.value, element.functionName);
                }
            }
            function exprBinop() {
                const OPS = {
                    "*": ["SMUL"],
                    "/": ["SDIV"],
                    "+": ["SADD"],
                    "-": ["SSUB"],
                    "%": ["SREM"],
                    "==": ["SEQ"],
                    "!=": ["SEQ", "SNOT"],
                    ">": ["SGT"],
                    "<": ["SLT"],
                    ">=": ["SLT", "SNOT"],
                    "<=": ["SGT", "SNOT"],
                };
                let opAsm = OPS[element.operator];
                codeGenForElement(element.left);
                codeGenForElement(element.right);
                for (const op of opAsm) {
                    code.add(op, element.token);
                }
            }
            function exprAssign() {
                codeGenForElement(element.value);
                code.add("LDI " + element.slot, element.name);
                code.add("FST", element.name);
            }
            function exprAssignGlobal() {
                codeGenForElement(element.value);
                code.add("SPOP", element.name);
                code.add("STA " + element.name.value, element.name);
            }

            switch (element.type) {
                case SeaCompiler.ELEMENT_TYPE.DEF_EXTERN: return /* no-op */;
                case SeaCompiler.ELEMENT_TYPE.DEF_FUNCTION: return defFunction();
                case SeaCompiler.ELEMENT_TYPE.BLOCK: return block();
                case SeaCompiler.ELEMENT_TYPE.STMT_VAR: return stmtVar();
                case SeaCompiler.ELEMENT_TYPE.STMT_RETURN: return stmtReturn();
                case SeaCompiler.ELEMENT_TYPE.STMT_IF: return stmtIf();
                case SeaCompiler.ELEMENT_TYPE.STMT_FOR: return stmtFor();
                case SeaCompiler.ELEMENT_TYPE.STMT_WHILE: return stmtWhile();
                case SeaCompiler.ELEMENT_TYPE.STMT_EXPR: return stmtExpr();
                case SeaCompiler.ELEMENT_TYPE.EXPR_INT: return exprInt();
                case SeaCompiler.ELEMENT_TYPE.EXPR_IDENT: return exprIdent();
                case SeaCompiler.ELEMENT_TYPE.EXPR_GLOBAL_IDENT: return exprGlobalIdent();
                case SeaCompiler.ELEMENT_TYPE.EXPR_INVOKE: return exprInvoke();
                case SeaCompiler.ELEMENT_TYPE.EXPR_BINOP: return exprBinop();
                case SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN: return exprAssign();
                case SeaCompiler.ELEMENT_TYPE.EXPR_ASSIGN_GLOBAL: return exprAssignGlobal();
                default:
                    console.error(element);
                    throw new Error("Unknown element type: " + element.type);
            }
        }

        let main = ast.functions["main"];
        if (!main) {
            ast.errors.push({
                message: "No `main` function found",
                token: this.tokens[0] || {line: 1, col: 1},
            });
            return code;
        }
        if (main.parameters.length !== 0) {
            ast.errors.push({
                message: "`main` function must have no parameters",
                token: main.parameters[0].token,
            });
            return code;
        }

        for (const [name, val] of Object.entries(ast.globals)) {
            if (val) {
                codeGenForElement(val);
                code.add("SPOP");
                code.add("STA " + name, val.token);
            }
        }
        codeGenForElement({
            type: SeaCompiler.ELEMENT_TYPE.EXPR_INVOKE,
            functionName: main.functionName,
            args: [],
        });
        if (main.returnType.value === "int") {
            codeGenForElement({
                type: SeaCompiler.ELEMENT_TYPE.EXPR_INVOKE,
                functionName: {type: SeaCompiler.ELEMENT_TYPE.EXPR_IDENT, value: "put"},
                args: [],
            })
        }
        code.add("HLT");

        for (const func of Object.values(ast.functions)) {
            codeGenForElement(func);
        }
        for (const [name, val] of Object.entries(ast.globals)) {
            code.add(name + " DAT 0");
        }

        for (const [label, value] of Object.entries(overflowValues)) {
            code.add(label + " DAT " + value);
        }

        return code;
    }

    compile(seaSource) {
        this.tokens = this.tokenize(seaSource);
        let ast = this.parse(this.tokens);

        let codeGenResult = this.codeGen(ast);

        let parseResult = {
            parsedElements: ast,
            sourceMap: codeGenResult.sourceMap,
            assembly: codeGenResult.getAssembly(),
            errors: ast.errors,
            originalSource: seaSource,
        }

        return parseResult;
    }
}