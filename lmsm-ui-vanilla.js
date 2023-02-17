class LMSMUi {

  lmsm = null;
  asmEditor = null;
  firthEditor = null;
  assembled = null;
  firthSourceMap = null;
  assemblySourceMap = null;
  speed = 500;

  outputAppendHandler = (e) => {
    e.target.innerHTML += `<div>${e.detail.entry}</div>`;
  }


  makeLMSM() {
    const lmsm = new LittleManStackMachine();
    lmsm.outputCallback = (value) => {
      const elem = document.querySelector("#outputPane");
      const event = new CustomEvent("output:append", {
        detail: {
          timestamp: new Date(),
          entry: value,
        }
      });
      elem.dispatchEvent(event);
    }
    const outputPane = document.querySelector("#outputPane");
    outputPane.removeEventListener('output:append', this.outputAppendHandler);
    outputPane.addEventListener('output:append', this.outputAppendHandler);

    const callback = (mutationList, observer) => {
      mutationList.forEach((mutation) => {
        switch (mutation.type) {
          case 'childList':
            mutation.target.scroll({ top: mutation.target.scrollHeight, left: 0, behavior: 'smooth' });
            break;
          default: break;
        }
      })
    };
    const observer = new MutationObserver(callback);
    observer.observe(outputPane, { childList: true });

    return lmsm;
  }
  constructor() {
    this.lmsm = this.makeLMSM();

    CodeMirror.defineSimpleMode('lmsm-assembly', {
      start: [
        {
          regex: /(?:CALL|DAT|ADD|SUB|STA|LDI|LDA|BRA|BRZ|BRP|NOOP|INP|OUT|SPUSH|SPOP|SDUP|SDROP|SSWAP|SADD|SSUB|SMUL|SDIV|SMAX|SMIN|JAL|RET|HLT)\b/,
          token: 'keyword'
        },
        {
          regex: /\d\d/,
          token: 'number',
        },
      ],
    });

    this.asmEditor = CodeMirror.fromTextArea(document.querySelector('#codeEditor'), {
      lineNumbers: true,
      tabSize: 2,
    });
    // TODO - ASM Linter
    this.asmEditor.setSize('100%', '25em');
    this.asmEditor.setOption('mode', 'lmsm-assembly');


    CodeMirror.defineSimpleMode('firth', {
      start: [
        {
          regex: /(?:def|loop|get|else|stop|var|return|swap|end|dup|do)\b/,
          token: 'keyword'
        },
        {
          regex: /zero\?/,
          token: 'keyword',
        },
        {
          regex: /asm/,
          token: 'keyword',
          mode: { spec: 'lmsm-assembly', end: /end/ }
        },
        {
          regex: /\*/,
          token: 'operator'
        },
        {
          regex: /\d\d/,
          token: 'number',
        },
      ],
    });

    this.firthEditor = CodeMirror.fromTextArea(document.querySelector('#codeEditorFirth'), {
      lineNumbers: true,
      tabSize: 2,
      lint: {
        getAnnotations: (x) => {
          let diagnostics = []
          if (this.firthEditor) {
            let compiler = new FirthCompiler();
            let compileResult = compiler.compile(this.firthEditor.getValue());
            for (const error of compileResult.errors) {
              diagnostics.push({
                from: {
                  line: error.token.line - 1,
                  ch: error.token.lineOffset
                },
                to: {
                  line: error.token.line - 1,
                  ch: error.token.lineOffsetEnd
                },
                message: error.message,
                severity: "error"
              })
            }
          }
          return diagnostics
        }
      },
    });
    this.firthEditor.setSize('100%', '25em');
    this.firthEditor.setOption('mode', 'firth');
  }

  clearOutput() {
    document.querySelector('#outputPane').innerHTML = '';
  }

  updateMemory() {
    const mem = document.querySelectorAll(".memory tr input");
    mem.forEach((m, i) => {
      this.setMemory(i, m.value);
    })
  }

  syncToDOM() {
    document.querySelector("#pc").value = this.getProgramCounter();
    document.querySelector("#acc").value = this.getAccumulator();
    document.querySelector("#ci").value = this.getCurrentInstruction();
    document.querySelector("#sp").value = this.getStackPointer();
    document.querySelector("#rap").value = this.getReturnAddressPointer();

    document.querySelector("#statusOutput").value = this.getStatus();
    document.querySelector("#nextInstructionOutput").innerHTML = this.getNextInstructionDescription();

    const slots = document.querySelectorAll(".memory tr input");
    slots.forEach((s, i) => {
      s.value = this.getMemory(i);
    });

    const pc = document.querySelectorAll(".program_counter");
    pc.forEach((m, i) => {
      m.classList.remove("program_counter");
    });
    slots.item(this.getProgramCounter()).classList.add("program_counter");

    const sp = document.querySelectorAll(".stack_pointer");
    sp.forEach((m, i) => {
      m.classList.remove("stack_pointer");
    });
    if (this.getStackPointer() < 200) {
      slots.item(this.getStackPointer()).classList.add("stack_pointer");
    }

    const rap = document.querySelectorAll(".return_address_pointer");
    rap.forEach((m, i) => {
      m.classList.remove("return_address_pointer");
    });
    if (this.getReturnAddressPointer() > 100) {
      slots.item(this.getReturnAddressPointer()).classList.add("return_address_pointer");
    }
  }

  getNextInstruction() {
    return this.getMemory(this.getProgramCounter());
  }

  getNextInstructionDescription() {
    let nextInstruction = this.getNextInstruction()
    let detail = "";
    if (nextInstruction == null) {
      detail = "No Instruction Found";
    } else if (nextInstruction === 0) {
      detail = "HLT - The Halt Instruction.  This instruction will halt the machine.";
    } else if (100 <= nextInstruction && nextInstruction < 200) {
      detail = "ADD - The Add Instruction.  This instruction will add the value found in memory slot " + (nextInstruction - 100) + " to the value found in the accumulator register.";
    } else if (200 <= nextInstruction && nextInstruction < 200) {
      detail = "SUB - The Subtraction Instruction.  This instruction will subtract the value found in memory slot " + (nextInstruction - 100) + " to the value found in the accumulator register.";
    } else if (300 <= nextInstruction && nextInstruction < 400) {
      detail = "STA - The Store Instruction.  This instruction will store the accumulator to the memory slot " + (nextInstruction - 100);
    } else if (400 <= nextInstruction && nextInstruction < 500) {
      detail = "LDI - The Load Immediate Instruction.  This instruction will put the value " + (nextInstruction - 400) + " into the accumulator";
    } else if (500 <= nextInstruction && nextInstruction < 600) {
      detail = "LDA - The Load Instruction.  This instruction will load the value in the memory slot " + (nextInstruction - 100) + " into the accumulator";
    } else if (600 <= nextInstruction && nextInstruction < 700) {
      detail = "BRA - The Branch Unconditionally Instruction.  This instruction will update the program counter to the value " + (nextInstruction - 100);
    } else if (700 <= nextInstruction && nextInstruction < 800) {
      detail = "BRZ - The Branch If Zero Instruction.  This instruction will update the program counter to the value " + (nextInstruction - 100) + " if the current value of the accumulator is zero";
    } else if (800 <= nextInstruction && nextInstruction < 900) {
      detail = "BRP - The Branch If Positive Instruction.  This instruction will update the program counter to the value " + (nextInstruction - 100) + " if the current value of the accumulator is positive or zero";
    } else if (901 === nextInstruction) {
      detail = "INP - The Input Instruction.  This instruction will ask the user for a numeric value and place it in the accumulator";
    } else if (902 === nextInstruction) {
      detail = "OUT - The Output Instruction.  This instruction will print the current value of the accumulator to the output";
    } else if (910 === nextInstruction) {
      detail = "JAL - The Jump & Link Instruction.  This instruction will consume the top of the value stack and update the program counter to it.  It will also push the address of the next instruction onto the return address stack.";
    } else if (911 === nextInstruction) {
      detail = "RET - The Return Instruction.  This instruction will consume the top of the return address stack and update the program counter to it.";
    } else if (920 === nextInstruction) {
      detail = "SPUSH - The Push Instruction.  This instruction will push the value of the accumulator onto the value stack";
    } else if (921 === nextInstruction) {
      detail = "SPOP - The Pop Instruction.  This instruction will pop the opt value of the value stack off and place it in the accumulator";
    } else if (922 === nextInstruction) {
      detail = "SDUP - The Duplicate Instruction.  This instruction will duplicate the value on the top of the value stack";
    } else if (923 === nextInstruction) {
      detail = "SDROP - The Drop Instruction.  This instruction will drop/remove the value on the top of the value stack";
    } else if (924 === nextInstruction) {
      detail = "SSWAP - The Swap Instruction.  This instruction will swap the two values on the top of the value stack";
    } else if (930 === nextInstruction) {
      detail = "SADD - The Stack Add Instruction.  This instruction will add the top two values on the top of the value stack and replace them with the result";
    } else if (931 === nextInstruction) {
      detail = "SSUB - The Stack Subtract Instruction.  This instruction will subtract the top two values on the top of the value stack and replace them with the result";
    } else if (932 === nextInstruction) {
      detail = "SMUL - The Stack Multiply Instruction.  This instruction will multiply the top two values on the top of the value stack and replace them with the result";
    } else if (933 === nextInstruction) {
      detail = "SDIV - The Stack Divide Instruction.  This instruction will divide the top two values on the top of the value stack and replace them with the result";
    } else if (934 === nextInstruction) {
      detail = "SMAX - The Stack Max Instruction.  This instruction will remove the top two values on the top of the value stack and replace them with the maximum of those values";
    } else if (935 === nextInstruction) {
      detail = "SMIN - The Stack Min Instruction.  This instruction will remove the top two values on the top of the value stack and replace them with the minimum of those values";
    } else {
      detail = "Unknown instruction - The behavior of this machine instruction is undefined.";
    }

    let desc = `<h3>Instruction: ${nextInstruction || ''}</h3>
                <p>${detail}</p>`;
    return desc;
  }

  getStatus() {
    return this.lmsm.status;
  }

  resetEditor() {
  }

  compile() {
    this.lmsm = this.makeLMSM();
    this.resetEditor();
    const code = this.firthEditor.getValue();

    let compiler = new FirthCompiler();
    let compileResult = compiler.compile(code);
    if (compileResult.errors.length > 0) {
      console.error("Compilation Errors:")
      for (const err of compileResult.errors) {
        console.error(err)
      }
      return;
    }

    this.firthSourceMap = compileResult.sourceMap;
    this.asmEditor.setValue(compileResult.assembly);

    let assembler = new LMSMAssembler();
    let assemblyResult = assembler.assemble(compileResult.assembly);

    this.assembled = this.lmsm.assemble(compileResult.assembly);

    this.assemblySourceMap = assemblyResult.sourceMap;
    this.lmsm.load(assemblyResult.machineCode);
  }

  assemble() {
    this.lmsm = this.makeLMSM();
    this.resetEditor();
    const code = this.asmEditor.getValue();
    this.assembled = this.lmsm.assemble(code);
    this.lmsm.load(this.assembled);
    return this.assembled;
  }

  runLoop() {
    if (this.lmsm.status === 'Stopped') {
      this.currentTimeout = null;
      return;
    }

    this.step()
    this.syncToDOM();

    this.currentTimeout = setTimeout(() => {
      this.runLoop();
    }, this.speed);
  }

  pause() {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }

  resume() {
    this.runLoop();
  }

  setSpeed(delay) {
    this.speed = delay;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = setTimeout(() => {
        this.runLoop();
      }, this.speed);
    }
  }

  run() {
    // TODO reset registers & upper memory?
    this.setProgramCounter(0);
    this.lmsm.status = "Ready";
    this.runLoop(1);
  }

  assembleAndRun() {
    this.lmsm = this.makeLMSM();
    this.resetEditor();
    const code = this.asmEditor.getValue();
    this.lmsm.assembleAndRun(code);
  }

  reset() {
    this.resetEditor();
    this.setProgramCounter(0);
    this.setStackPointer(200);
    this.setReturnAddressPointer(99);
    this.lmsm.status = "Ready";
  }

  step() {

    if (this.lmsm.status === "Stopped") {
      return;
    }

    this.lmsm.step();

    let currentProgramCounter = this.lmsm.registers.program_counter;

    if (this.lastActiveAssemblyLine != null) {
      this.asmEditor.getDoc()
        .removeLineClass(this.lastActiveAssemblyLine, 'background', 'markCode');
    }
    if (this.assemblySourceMap) {

      let mappedAssemblyLine = this.assemblySourceMap[currentProgramCounter];
      if (mappedAssemblyLine != null) {
        // editor is zero-based
        this.lastActiveAssemblyLine = mappedAssemblyLine - 1;
      } else {
        this.lastActiveAssemblyLine = null;
      }

      if (this.lastActiveAssemblyLine) {
        this.asmEditor.getDoc()
            .addLineClass(this.lastActiveAssemblyLine, 'background', 'markCode');
      }
    }

    if (this.lastActiveFirthLine != null) {
      if (this.lastActiveFirthLine) {
        this.firthEditor.getDoc()
            .removeLineClass(this.lastActiveFirthLine, 'background', 'markCode');
      }
    }

    if (this.firthSourceMap && this.lastActiveAssemblyLine != null) {
      let mappedValue = this.firthSourceMap[this.lastActiveAssemblyLine + 1] - 1;
      if (mappedValue != null) {
        // editor is zero-based
        this.lastActiveFirthLine = mappedValue - 1;
      } else {
        this.lastActiveFirthLine = null;
      }
      if (this.lastActiveFirthLine) {
        this.firthEditor.getDoc()
            .addLineClass(this.lastActiveFirthLine, 'background', 'markCode');
      }
    }
  }

  getProgramCounter() {
    return this.lmsm.registers.program_counter;
  }

  setProgramCounter(value) {
    this.lmsm.registers.program_counter = value;
  }

  getAccumulator() {
    return this.lmsm.registers.accumulator;
  }
  setAccumulator(value) {
    this.lmsm.registers.accumulator = value;
  }

  getCurrentInstruction() {
    return this.lmsm.registers.current_instruction;
  }
  setCurrentInstruction(value) {
    this.lmsm.registers.current_instruction = value;
  }

  getStackPointer() {
    return this.lmsm.registers.stack_pointer;
  }

  setStackPointer(value) {
    this.lmsm.registers.stack_pointer = value;
  }

  getReturnAddressPointer() {
    return this.lmsm.registers.return_address_pointer;
  }

  setReturnAddressPointer(value) {
    this.lmsm.registers.return_address_pointer = value;
  }

  getMemory(mempos) {
    return this.lmsm.memory[mempos] == null ? null : this.lmsm.memory[mempos];
  }

  setMemory(position, value) {
    this.lmsm.memory[position] = value;
  }

  cellClass(mempos) {
    if (this.lmsm.registers.program_counter == mempos)
      return 'memory_slot program_counter'
    else if (this.lmsm.registers.stack_pointer === mempos)
      return 'memory_slot stack_pointer'
    else if (this.lmsm.registers.return_address_pointer === mempos)
      return 'memory_slot return_address_pointer'
    else return 'memory_slot';
  }

  resetMachine() {
    this.lmsm = new LittleManStackMachine();
  }

}