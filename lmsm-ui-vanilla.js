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
    document.querySelector("#currentInstructionOutput").value = this.getCurrentInstructionDescription();

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

  getCurrentInstructionDescription() {
    return "TODO";
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