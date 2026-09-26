describe('Kanban Board', () => {
  it('Visits the app root url dan memaparkan board', () => {
    cy.visit('/')
    cy.contains('ion-title', 'Task Management Board')
    cy.contains('h2', 'To do')
    cy.contains('h2', 'Doing')
    cy.contains('h2', 'Rework')
  })
})
