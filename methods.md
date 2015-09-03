client.create @object
client.get @clientId
client.getAll
client.getTickets @clientId
client.remove @clientId
client.setStatus @clientId @status

ticket.create @object
ticket.get @ticketId
ticket.getAll 
ticket.find @key @value
ticket.update @ticketId @object
ticket.remove @ticketId

worker.create @object
worker.get @workerId
worker.getAll
worker.getTickets @workerId
worker.remove @workerId
