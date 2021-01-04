import React, { useState, useEffect, Fragment } from 'react'
import { useDebounce } from 'use-debounce'
import axios from 'axios'
import { BrowserRouter as Router, Link } from 'react-router-dom'
import styled from 'styled-components'
import Subtask from './Subtask'
import NewSubtask from './NewSubtask'
import TextField from '@material-ui/core/TextField'
import { InputTodo } from '../Todo-Main/Todos'

const Card = styled.div `
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 4px;
    padding: 20px;
    margin: 0 20px 20px 0;
`
const Description = styled.div `
    padding: 0 0 20px 0;
    font-size: 14px;
`
const Wrapper = styled.div`
    padding-top: 110px;
    height: 100vh;
    width: 55%;
    margin: auto;
`
const Title = styled.div`
    padding-left: 5px;
    padding-bottom: 40px;
    font-size: 50px;
    font-weight: bold;
`

export interface TodoSubtaskProps {
    match: {
        params: {
            todo_id: string
        }
    }
}

export interface Subtasks {
    id: string,
    attributes: {
        text: string,
        done: boolean,
        todo_id: number
    }    
}

const Todo = (props: TodoSubtaskProps) => {
    const {todo_id} = props.match.params
    
    const [todo, setTodo] = useState<InputTodo>({ title: "" })

    const [debouncedTodo] = useDebounce(todo, 1000)
    const [subtasks, setSubtasks] = useState<Subtasks[]>([])
    const [renderSubtasks, setRenderSubtasks] = useState<JSX.Element[]>([])
    const [loaded, setLoaded] = useState(false)

    const [inputSubtasks, setInputSubtasks] = useState({text: '', done: false, todo_id: todo_id})

    useEffect( () => {
        const url = `/api/v1/todos/${todo_id}`
        
        axios.get(url)
        .then( 
            resp => { 
                setTodo(resp.data.data.attributes) 
                // todo has {done:false, id: 1, title: "buy milk", urgency:3}
                setSubtasks(resp.data.included)
                // subtasks are an array of objects with [{id:"1", type:"subtask", attributes:{}}]
                setLoaded(true)
            }
        )
        .catch( resp => console.log(resp) )
    }, [])

    const handleChangeTodo = (e: React.ChangeEvent<HTMLInputElement>) => { setTodo({...todo, title: e.target.value}) }

    useEffect( () => {
        if (loaded) {
            const url = `/api/v1/todos/${todo_id}`
            
            axios.patch(url, {title: todo.title})
            .then( 
                resp => { 
                    console.log(resp)
                }
            )
            .catch( resp => console.log(resp) )
        }
    }, [debouncedTodo])

    const handleNewSubtaskKeypress = (e: React.KeyboardEvent<Element>) => {
        if (e.key === 'Enter') {
            axios.post('/api/v1/subtasks', inputSubtasks)
            .then (resp => {
                setSubtasks(subtasks.concat([resp.data.data]))
                setInputSubtasks({...inputSubtasks, text: '', done: false})
            })
            .catch( resp => console.log(resp) )
        }
    }

    const handleNewSubtaskChange = (e: React.ChangeEvent<HTMLInputElement>) => { setInputSubtasks({...inputSubtasks, text: e.target.value}) }
    
    const updateSubtask = (id: string, done: boolean) => {
        setSubtasks(subtasks.map( subtask => 
            subtask.id === id
                ? {...subtask, attributes: {...subtask.attributes, done: !done} }
                : subtask
            )
        )
    }

    useEffect( ()=> {
        const undoneSubtasks: Subtasks[] = subtasks.filter(subtask => !subtask.attributes.done).sort( (a, b) => (a.id > b.id ? 1 : -1))
        const doneSubtasks: Subtasks[] = subtasks.filter(subtask => subtask.attributes.done).sort( (a, b) => (a.id > b.id ? 1 : -1))

        setRenderSubtasks([...undoneSubtasks, ...doneSubtasks].map( subtask => {
                return (
                    <Subtask
                        key={subtask.id}
                        id={subtask.id}
                        todo_id={todo.id}
                        updateSubtask={updateSubtask}
                        attributes={subtask.attributes}
                        loaded={loaded}
                    />
                )
            })
        )
    }, [loaded, subtasks])

    return (
        <div>
        {
            loaded && 
            <Wrapper>
                <Title> Edit Task </Title>
                    <TextField 
                        style= {{
                            width: "100%",
                            margin: 5,
                            marginBottom: 25
                        }}
                        inputProps={{ maxlength: 50 }}
                        variant="outlined"
                        onChange={handleChangeTodo} 
                        value={todo.title} 
                        type="text" 
                        name="title" 
                        label="Task"
                    />
                    <br/>
                        {renderSubtasks}
                    <br/>
                    <NewSubtask
                        inputSubtasks={inputSubtasks}
                        handleNewSubtaskKeypress={handleNewSubtaskKeypress}
                        handleNewSubtaskChange={handleNewSubtaskChange}
                    />
            </Wrapper>
        }
        </div>
    )
}

export default Todo