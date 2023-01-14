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
            this.registers.currentInstruction = this.memory[this.registers.program_counter];
            this.registers.program_counter++;
            this.executeInstruction(this.registers.currentInstruction);
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
        } else if (instruction === 901) {
            // TODO
        } else if (instruction === 902) {
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
            this.registers.stack_pointer--;
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
        let tokens = asmSource.split(" ");
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
                    resolvedArg = labelsToInstructions[instruction.arg].offset;
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

    OPS = ["+", "-"]

    compile(firthSource) {

        let tokens = firthSource.split(/ \n/);

        let rootElements = this.parseElements(tokens);

        let assembly = this.codeGen(parseTree);


    }

    parseElement(tokens) {
        if (!isNaN(tokens[0])) {
            return {
                type:"Number",
                value: parseInt(tokens.shift()),
            }
        } else if (this.OPS.includes(tokens[0])) {
            return {
                type:"Op",
                op: tokens.shift(),
            }
        } else {
            return {
                type:"ERROR"
                message: "Uno"
            }
        }
    }

    parseElements(tokens) {
        let elements = [];
        while (tokens.length > 0) {
            elements.push(parseElement(tokens));
        }
        return elements;
    }
}

