export async function queryUserInput(configuration: any): Promise<string> {
  const query = configuration.query || ''
  const defaultText = configuration.defaultText || ''
  const placeholder = configuration.placeholder || ''

  return new Promise((resolve) => {
    const dialog = document.createElement('dialog')
    dialog.id = 'user-input-dialog'
    dialog.innerHTML = `
<div class="user-input-title">
  User Input
</div>
<form>
  <p>${query}</p>
  <input id="user-input" type="text" placeholder="${placeholder}" value="${defaultText}" />
  <div>
    <button id="confirm-btn" value="">Submit</button>
    <button value="cancel" formmethod="dialog">Cancel</button>
  </div>
</form>
  `

    dialog.querySelector('#confirm-btn')!.addEventListener('click', (e) => {
      e.preventDefault() // do not reload the page on form submit
      dialog.close(
        (dialog.querySelector('#user-input') as HTMLInputElement).value
      )
    })

    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue)
      document.body.removeChild(dialog)
    })

    document.body.appendChild(dialog)

    dialog.showModal()
  })
}
