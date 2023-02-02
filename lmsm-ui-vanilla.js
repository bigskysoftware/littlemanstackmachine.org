class LMSMUi {

  lmsm = null;
  asmEditor = null;
  firthEditor = null;
  assembled = null;
  firthSourceMap = null;
  assemblySourceMap = null;
  speed = 500;
  pauseNextTick = false;

  static makeLMSM() {
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
    return lmsm;
  }
  constructor() {
    this.lmsm = LMSMUi.makeLMSM();

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
        getAnnotations : (x) => {
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
        }},
    });
    this.firthEditor.setSize('100%', '25em');
    this.firthEditor.setOption('mode', 'firth');
  }
  resetEditor() {
  }

  compile() {
    this.lmsm = LMSMUi.makeLMSM();
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
    this.lmsm = LMSMUi.makeLMSM();
    this.resetEditor();
    const code = this.asmEditor.getValue();
    this.assembled = this.lmsm.assemble(code);
    this.lmsm.load(this.assembled);
    return this.assembled;
  }

  runLoop(step) {
    if (this.pauseNextTick) {
      this.pauseNextTick = false
      return;
    }
    if (this.lmsm.status === 'Stopped') {
      return;
    }

    this.step()
    syncToDOM();
    if (step > 100) {
      let cont = confirm("100 steps have been made, continue executing?");
      if (!cont) {
        return;
      }
    }

    setTimeout(() => {
      this.runLoop(step + 1);
    }, this.speed);
  }

  pause() {
    this.pauseNextTick = true;
  }
  run() {
    // TODO reset registers & upper memory?
    this.setProgramCounter(0);
    this.lmsm.status = "Ready";
    this.runLoop(1);
  }

  assembleAndRun() {
    this.lmsm = LMSMUi.makeLMSM();
    this.resetEditor();
    const code = this.asmEditor.getValue();
    this.lmsm.assembleAndRun(code);
  }

  step() {

    if (this.lmsm.status === "Stopped") {
      this.resetEditor();
      this.setProgramCounter(0);
      this.lmsm.status = "Ready";
    }

    this.lmsm.step();

    let currentProgramCounter = this.lmsm.registers.program_counter;

    if (this.lastActiveAssemblyLine != null) {
      this.asmEditor.getDoc()
          .removeLineClass(this.lastActiveAssemblyLine, 'background', 'markCode');
    }
    if (this.assemblySourceMap) {
      this.lastActiveAssemblyLine = this.assemblySourceMap[currentProgramCounter] - 1;
      this.asmEditor.getDoc()
          .addLineClass(this.lastActiveAssemblyLine, 'background', 'markCode');
    }

    if (this.lastActiveFirthLine != null) {
      this.firthEditor.getDoc()
          .removeLineClass(this.lastActiveFirthLine, 'background', 'markCode');
    }

    if (this.firthSourceMap && this.lastActiveAssemblyLine != null) {
      this.lastActiveFirthLine = this.firthSourceMap[this.lastActiveAssemblyLine + 1] - 1;
      this.firthEditor.getDoc()
          .addLineClass(this.lastActiveFirthLine, 'background', 'markCode');
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