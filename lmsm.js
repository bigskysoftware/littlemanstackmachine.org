class LittleManStackMachine {

    state = "Ready"

    memory = []

    output = []

    registers = {
        program_counter:0,
        current_instruction:0,
        accumulator:0,
        stack_pointer:200,
        return_address_pointer:99
    }

    compileAndRun(src) {
        let compiler = new FirthCompiler();
        let compiledAssembly = compiler.compile(src);
        console.log(compiledAssembly);
        let assembler = new LMSMAssembler();
        let machine_code = assembler.assemble(compiledAssembly);
        this.load(machine_code);
        this.run();
    }

    assembleAndRun(src) {
        let assembler = new LMSMAssembler();
        let machine_code = assembler.assemble(src);
        this.load(machine_code);
        this.run();
    }

    load(instructions) {
        this.memory = instructions;
    }

    step() {
        this.executeCurrentInstruction();
    }

    executeCurrentInstruction() {
        if (this.status !== "Stopped") {
            this.registers.current_instruction = this.memory[this.registers.program_counter];
            this.registers.program_counter++;
            this.executeInstruction(this.registers.current_instruction);
        }
    }

    run() {
        while (this.status !== "Stopped") {
            this.executeCurrentInstruction();
        }
    }

    executeInstruction(instruction) {
        if (instruction === 0) {
            this.state = "Stopped";
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
        } else if (instruction === 900) {
            // NOOP - do nothing
        } else if (instruction === 901) {
            // TODO
        } else if (instruction === 902) {
            console.log(this.registers.accumulator + " ");
            this.output.push(this.registers.accumulator);
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
        if (this.registers.accumulator > 999) {
            this.registers.accumulator = 999;
        }
        if (this.registers.accumulator < -999) {
            this.registers.accumulator = -999;
        }
    }

}

class LMSMAssembler {

    SYNTHETIC_INSTRUCTION = -1;
    INSTRUCTIONS = {
        "ADD": 100,
        "SUB": 200,
        "LDA": 300,
        "LDI": 400,
        "STA": 500,
        "BRA": 600,
        "BRZ": 700,
        "BRP": 800,
        "NOOP": 900,
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
        let tokens = asmSource.trim().split(/\s+/);
        let instructions = []
        let labelsToInstructions = {}
        let offset = 0;
        while (tokens.length > 0) {
            let token = tokens.shift();
            let instruction = {offset:offset};

            // label
            if (this.INSTRUCTIONS[token] == null) {
                instruction.label = token;
                labelsToInstructions[instruction.label] = instruction;
                token = tokens.shift()
            }

            instruction.token = token;

            if (this.ARG_INSTRUCTIONS.includes(instruction.token)) {
                token = tokens.shift()
                instruction.arg = token;
            }

            instructions.push(instruction);

            if (instruction.token === "CALL") {
                offset = offset + 3;
            } else if (instruction.token === "SPUSHI") {
                offset = offset + 2;
            } else {
                offset++;
            }
        }

        let machineCode = []
        for (const instruction of instructions) {
            let resolvedArg = null;
            if(instruction.arg){
                if (isNaN(instruction.arg)) {
                    let targetInstruction = labelsToInstructions[instruction.arg];
                    if (targetInstruction == null) {
                        throw "Cannot find label " + instruction.arg;
                    }
                    resolvedArg = targetInstruction.offset;
                } else {
                    resolvedArg = parseInt(instruction.arg);
                }
            }

            let baseValue = this.INSTRUCTIONS[instruction.token];
            if (baseValue === this.SYNTHETIC_INSTRUCTION) {
                if (instruction.token === "DAT") {
                    machineCode[instruction.offset] = resolvedArg;
                } else if (instruction.token === "CALL") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;
                    machineCode[instruction.offset + 2] = 910;

                } else if (instruction.token === "SPUSHI") {
                    machineCode[instruction.offset] = 400 + resolvedArg;
                    machineCode[instruction.offset + 1] = 920;

                }
            } else {
                if (this.ARG_INSTRUCTIONS.includes(instruction.token)) {
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

    conditional = 1;
    loop = 1;
    variable = 1;
    loopStack = [];

    OPS = {"+" : "SADD",
           "-" : "SSUB",
           "*" : "SMUL",
           "/" : "SDIV",
           "max" : "SMAX",
           "min" : "SMIN",
           "dup" : "SDUP",
           "swap" : "SSWAP",
           "drop" : "SDROP",
           "return" : "RET",
           "get" : "INP\nSPUSH",
           "." : "SDUP\nSPOP\nOUT"}

    FUNCTION_PATTERN = /^[a-zA-Z_]+\(\)$/
    VARIABLE_PATTERN = /^[a-zA-Z_]+$/
    VARIABLE_WRITE_PATTERN = /^[a-zA-Z_]+!$/

    compile(firthSource) {
        let tokens = firthSource.trim().split(/\s+/);
        let rootElements = this.parseFirthProgram(tokens);
        let assembly = this.codeGen(rootElements);
        return assembly
    }

    parseFunctionCall(tokens) {
        if (tokens[0] && tokens[0].match(this.FUNCTION_PATTERN)) {
            return {
                type: "FunctionCall",
                functionName: tokens.shift(),
            }
        }
    }

    parseInt(tokens) {
        if (!isNaN(tokens[0])) {
            return {
                type: "Number",
                value: parseInt(tokens.shift()),
            }
        }
    }

    parseOp(tokens) {
        if (this.OPS[tokens[0]]) {
            return {
                type: "Op",
                op: tokens.shift(),
            };
        }
    }

    parseFunctionDef(tokens) {
        if (tokens[0] === "def") {
            let functionDef = {
                type: "FunctionDefinition",
                token: tokens.shift(),
                name: tokens.shift(),
                body : [],
            };

            if (functionDef.name === null || !functionDef.name.match(this.FUNCTION_PATTERN)) {
                functionDef.error = "Function names must end with ()"
            }

            while (tokens.length > 0 && tokens[0] !== "end") {
                functionDef.body.push(this.parseElement(tokens));
            }

            if (tokens[0] === "end") {
                tokens.shift();
            } else {
                functionDef.error = "Expected 'end' to close function"
            }
            return functionDef;
        }
    }

    parseConditional(tokens) {
        if (tokens[0] === "zero?" || tokens[0] === "positive?") {
            let conditionalElt = {
                type: "Conditional",
                token: tokens.shift(),
                conditionCount: this.conditional++,
                trueBranch : [],
                falseBranch : [],
            };

            while (tokens.length > 0 && tokens[0] !== "end" && tokens[0] !== "else") {
                conditionalElt.trueBranch.push(this.parseElement(tokens));
            }

            if (tokens[0] === "else") {
                while (tokens.length > 0 && tokens[0] !== "end") {
                    conditionalElt.falseBranch.push(this.parseElement(tokens));
                }
            }

            if (tokens[0] === "end") {
                tokens.shift();
            } else {
                conditionalElt.error = "Expected 'end' to close conditional"
            }
            return conditionalElt;
        }
    }

    parseStop(tokens) {
        if (tokens[0] === "stop") {
            let currentLoop = this.loopStack[this.loopStack.length - 1];
            let stopLoop = {
                type: "Stop",
                token: tokens.shift(),
                loop: currentLoop
            };
            return stopLoop;
        }
    }

    parseLoop(tokens) {
        if (tokens[0] === "do") {
            let loopElt = {
                loopCount : this.loop++,
                type: "Loop",
                token: tokens.shift(),
                body : [],
            };

            this.loopStack.push(loopElt);
            while (tokens.length > 0 && tokens[0] !== "loop") {
                loopElt.body.push(this.parseElement(tokens));
            }
            this.loopStack.pop();

            if (tokens[0] === "loop") {
                tokens.shift();
            } else {
                loopElt.error = "Expected 'loop' to close loop"
            }
            return loopElt;
        }
    }

    parseVariableDeclaration(tokens) {
        if (tokens[0] === "var") {
            let varToken = tokens.shift();
            let nameToken = tokens.shift();
            let variableElt = {
                variableCount : this.variable++,
                type: "VariableDeclaration",
                token: varToken,
                name: nameToken,
            };

            if (variableElt.name == null || !variableElt.name.match(this.VARIABLE_PATTERN)) {
                variableElt.error = "Expected variable to have a name"
            }
            return variableElt;
        }
    }

    parseVariableRead(tokens) {
        if (tokens[0].match(this.VARIABLE_PATTERN)) {
            return {
                type: "VariableRead",
                token: tokens.shift(),
            }
        }
    }

    parseVariableWrite(tokens) {
        if (tokens[0].match(this.VARIABLE_WRITE_PATTERN)) {
            return {
                type: "VariableWrite",
                token: tokens.shift(),
            }
        }
    }

    parseElement(tokens) {
        let elt = this.parseInt(tokens);
        if (elt) {
            return elt;
        }

        let op = this.parseOp(tokens);
        if (op) {
            return op;
        }

        let conditional = this.parseConditional(tokens);
        if (conditional) {
            return conditional;
        }

        let call = this.parseFunctionCall(tokens);
        if (call) {
            return call;
        }

        let def = this.parseFunctionDef(tokens);
        if (def) {
            return def;
        }

        let loop = this.parseLoop(tokens);
        if (loop) {
            return loop;
        }

        let stop = this.parseStop(tokens);
        if (stop) {
            return stop;
        }

        let variableRead = this.parseVariableRead(tokens);
        if (variableRead) {
            return variableRead;
        }

        let variableWrite = this.parseVariableWrite(tokens);
        if (variableWrite) {
            return variableWrite;
        }

        return {
            type: "ERROR",
            message: "Unknown token : " + tokens.shift()
        };
    }


    parseFirthProgram(tokens) {
        let program = [];
        let varDeclaration = this.parseVariableDeclaration(tokens);
        while (varDeclaration != null) {
            program.push(varDeclaration);
            varDeclaration = this.parseVariableDeclaration(tokens);
        }
        let restOfProgram = this.parseElements(tokens);
        for (const elt of restOfProgram) {
            program.push(elt);
        }
        return program;
    }

    parseElements(tokens) {
        let elements = [];
        while (tokens.length > 0) {
            elements.push(this.parseElement(tokens));
        }
        return elements;
    }

    codeGenForElement(element, code) {
        if (element.type === "Number") {
            code.push("SPUSHI " + element.value + "\n");
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
            if (element.token === "zero?") {
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
                code.push("NOOP\n");
            }
            code.push(endLabel + " NOOP\n");
        } else if (element.type === "Loop") {
            let startLabel = "LOOP_" + element.loopCount;
            let endLabel = "END_LOOP_" + element.loopCount;
            code.push(startLabel + " ");
            for (const elt of element.body) {
                this.codeGenForElement(elt, code);
            }
            code.push("BRA " + startLabel + "\n");
            code.push(endLabel + " NOOP\n");
        } else if (element.type === "Stop") {
            code.push("BRA END_LOOP_" + element.loop.loopCount + "\n");
        } else if (element.type === "VariableRead") {
            code.push("LDA " + element.token + "\n");
        } else if (element.type === "VariableWrite") {
            let variableName = element.token.substring(0, element.token.length - 1);
            code.push("STA " + variableName + "\n");
        } else if (element.type === "VariableDeclaration") {
            code.push(element.name + " DAT 0\n");
        }
    }

    codeGen(elements) {
        let code = [];

        // generate non-functions first
        for (const element of elements.filter(element => element.type !== "FunctionDefinition" && element.type !== "VariableDeclaration")) {
            this.codeGenForElement(element, code);
        }
        code.push("HLT\n"); // End program with a halt

        // generate functions second
        for (const element of elements.filter(element => element.type === "FunctionDefinition")) {
            this.codeGenForElement(element, code);
        }

        // allocated variable memory third
        for (const element of elements.filter(element => element.type === "VariableDeclaration")) {
            this.codeGenForElement(element, code);
        }

        return code.join("");
    }
}

let lmsm = new LittleManStackMachine();
lmsm.compileAndRun(
    `var x
          10
          x!
          x .`)
console.log(lmsm.output)