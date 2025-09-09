import http from "http"
import { randomUUID } from "crypto"
import { URL } from "url"

let tasks = []

// função pra ler o body (pq node puro é chatão kkk)
function bodyReader(req){
  return new Promise((resolve)=>{
    let dados = ""
    req.on("data",(chunk)=>{
      dados += chunk
    })
    req.on("end",()=>{
      try{
        resolve(JSON.parse(dados))
      }catch(e){
        resolve({})
      }
    })
  })
}

const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url,`http://${req.headers.host}`)
  const path = url.pathname
  const method = req.method

  // criar task (POST /tasks)
  if(method==="POST" && path==="/tasks"){
    let body = await bodyReader(req)
    if(!body.title || !body.description){
      res.writeHead(400,{"Content-Type":"application/json"})
      return res.end(JSON.stringify({msg:"faltou title ou description"}))
    }

    let novaTask = {
      id: randomUUID(),
      title: body.title,
      description: body.description,
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date()
    }

    tasks.push(novaTask)
    res.writeHead(201,{"Content-Type":"application/json"})
    return res.end(JSON.stringify(novaTask))
  }

  // listar (GET /tasks?search=)
  if(method==="GET" && path==="/tasks"){
    let search = url.searchParams.get("search")
    let lista = tasks
    if(search){
      lista = tasks.filter(t=> t.title.includes(search) || t.description.includes(search))
    }
    res.writeHead(200,{"Content-Type":"application/json"})
    return res.end(JSON.stringify(lista))
  }

  // atualizar (PUT /tasks/:id)
  if(method==="PUT" && path.startsWith("/tasks/")){
    let id = path.split("/")[2]
    let task = tasks.find(t=>t.id===id)
    if(!task){
      res.writeHead(404,{"Content-Type":"application/json"})
      return res.end(JSON.stringify({msg:"task não existe"}))
    }

    let body = await bodyReader(req)
    if(body.title) task.title = body.title
    if(body.description) task.description = body.description
    task.updated_at = new Date()

    res.writeHead(200,{"Content-Type":"application/json"})
    return res.end(JSON.stringify(task))
  }

  // deletar (DELETE /tasks/:id)
  if(method==="DELETE" && path.startsWith("/tasks/")){
    let id = path.split("/")[2]
    let idx = tasks.findIndex(t=>t.id===id)
    if(idx===-1){
      res.writeHead(404,{"Content-Type":"application/json"})
      return res.end(JSON.stringify({msg:"não achei essa task"}))
    }
    tasks.splice(idx,1)
    res.writeHead(204)
    return res.end()
  }

  // marcar completo (PATCH /tasks/:id/complete)
  if(method==="PATCH" && path.endsWith("/complete")){
    let id = path.split("/")[2]
    let task = tasks.find(t=>t.id===id)
    if(!task){
      res.writeHead(404,{"Content-Type":"application/json"})
      return res.end(JSON.stringify({msg:"task não existe"}))
    }
    task.completed_at = task.completed_at ? null : new Date()
    task.updated_at = new Date()
    res.writeHead(200,{"Content-Type":"application/json"})
    return res.end(JSON.stringify(task))
  }

  // rota errada
  res.writeHead(404,{"Content-Type":"application/json"})
  res.end(JSON.stringify({msg:"rota errada"}))
})

server.listen(3000,()=>{
  console.log("Servidor rodando em http://localhost:3000 🚀")
})
