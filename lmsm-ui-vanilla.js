(function () {
  class LMSMUi {
    
    lmsm = null;
    editor = null;
    mode = 'firth';
    currentLineNumber = -1;
    constructor() {
      this.lmsm = new LittleManStackMachine();
      CodeMirror.defineSimpleMode('lmsm-assembly', {
        start: [
          {
            regex: /(?:DAT|ADD|SUB|STA|LDI|LDA|BRA|BRZ|BRP|NOOP|INP|OUT|SPUSH|SPOP|SDUP|SDROP|SSWAP|SADD|SSUB|SMUL|SDIV|SMAX|SMIN|JAL|RET|HLT|dat|add|sub|sta|ldi|lda|bra|brz|brp|noop|inp|out|spush|spop|sdup|sdrop|sswap|sadd|ssub|smul|sdiv|smax|smin|jal|ret|hlt)\b/,
            token: 'keyword'
          },
          {
            regex: /\d\d/,
            token: 'number',
          },
        ],
      });
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
            mode: {spec: 'lmsm-assembly', end: /end/}
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
      this.editor = CodeMirror(document.querySelector('#codeEditor'), {
        lineNumbers: true,
        tabSize: 2,
      });
      this.editor.setSize('100%', '50em');
      this.editor.setOption('mode', this.mode);
    }
    setMode(mode) {
      this.mode = mode;
      this.editor.setOption('mode', this.mode);
    }
    resetEditor() {
      if(this.currentLineNumber !== -1) {
        this.editor.getDoc().removeLineClass(this.currentLineNumber, 'background', 'markCode');
      }
      this.currentLineNumber = -1;
    }
    compile() {
      this.lmsm = new LittleManStackMachine();
      this.resetEditor();
      const code = this.editor.getValue();
      const compiled = this.lmsm.compile(code);
      const assembled = this.lmsm.assemble(compiled);
      this.lmsm.load(assembled);
    }
    assemble() {
      this.lmsm = new LittleManStackMachine();
      this.resetEditor();
      const code = this.editor.getValue();
      const assembled = this.lmsm.assemble(code);
      this.lmsm.load(assembled);
    }
    run() {
      this.lmsm.run();
    }
    assembleAndRun() {
      this.lmsm = new LittleManStackMachine();
      this.resetEditor();
      const code = this.editor.getValue();
      this.lmsm.assembleAndRun(code);
    }
    step() {
      if(this.currentLineNumber !== -1) {
        this.editor.getDoc()
          .removeLineClass(this.currentLineNumber, 'background', 'markCode');
        this.lmsm.step();
      }
      this.currentLineNumber++;
      this.editor.getDoc()
        .addLineClass(this.currentLineNumber, 'background', 'markCode');
    }
    getProgramCounter() {
      return this.lmsm.registers.program_counter;
    }

    getAccumulator() {
      return this.lmsm.registers.accumulator;
    }
    getCurrentInstruction() {
      return this.lmsm.registers.current_instruction;
    }
    getStackPointer() {
      return this.lmsm.registers.stack_pointer;
    }
    getReturnAddressPointer() {
      return this.lmsm.registers.return_address_pointer;
    }

    memoryLayout() {
      let headers = "";
      for(let i = 0; i < 10; i++) {
        headers += `<th>${i}</th>`;
      };

      let rows = "";
      for(let i = 0; i < 20; i++) {
        rows += "<tr>";
        let cells = `<td class="bold">${(i) * 10}</td>`;
        for(let j= 0; j < 10; j++) {
          const mempos = ((i) * 10) + (j);
          cells += `
          <td class="memorySlot">
            <label>
              <input 
                size="3" 
                type="text"
                data-mempos="${mempos}" 
                class="${this.cellClass(mempos)}" 
                value="${this.lmsm.getMemory[mempos] || ''}"
                _="
                on setMemory[mempos === my data-mempos]
                set @value to the event's value
                "
              />
            </label>
          </td>
          `
        }
        rows += cells;
        rows += "</tr>"
      }
      return `
      <table>
      <caption></caption>
      <thead>
        <th></th>
        ${headers}
      </thead>
      <tbody>
      ${rows}
      </tbody>
    </table>`
    }
    cellClass(mempos) {
      if(this.lmsm.registers.program_counter == mempos)
      return 'memory_slot program_counter'
      else if (this.lmsm.registers.stack_pointer === mempos)
      return 'memory_slot stack_pointer'
      else if(this.lmsm.registers.return_address_pointer === mempos)
      return 'memory_slot return_address_pointer'
      else return 'memory_slot';
    }

  }
  window.lmsm = new LMSMUi();
})();