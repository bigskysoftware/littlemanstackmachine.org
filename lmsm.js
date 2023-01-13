class LittleManStackMachine {

    state = "Ready"

    memory = []

    output = []

    registers = {
        program_counter:0,
        current_instruction:0,
        accumulator:0,
        stack_pointer:200,
        return_address_pointer:0
    }

    load(instructions) {
        this.memory = instructions;
    }

    step() {
        this.executeCurrentInstruction();
    }

    executeCurrentInstruction() {
        if (this.status !== "Stopped") {
            let currentInstruction = this.memory[this.registers.program_counter];
            currentInstruction++;
            this.executeInstruction(currentInstruction);
        }
    }

    run() {
        while (this.status() !== "Stopped") {
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
            this.registers.stack_pointer--;
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



}

class FirthCompiler {

}