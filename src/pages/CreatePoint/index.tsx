import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import './style.css'
import logo from '../../assets/logo.svg'
import { Link, useHistory } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Map, TileLayer, Marker } from 'react-leaflet'
import api from '../../services/api'
import axios from 'axios'
import { LeafletMouseEvent } from 'leaflet'

interface Item {
  id: number
  title: string
  image_url: string
}
interface City {
  id: number
  nome: string
}
interface Country {
  id: number
  sigla: string
  nome: string
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data)
    })
      .catch(err => {
        console.log(err)
      })
  }, [])
  const [selectedUf, setSelectedUf] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [city, setCity] = useState<City[]>([])
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
  const [country, setCountry] = useState<Country[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  })
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const history = useHistory()
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords
      setInitialPosition([latitude, longitude])
    })

  }, [])

  useEffect(() => {
    axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(response => {
        setCountry(response.data)
      })
      .catch(err => {
        console.log(err)
      })
  }, [])

  function getCity(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value
    setSelectedUf(uf)
    axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(response => {
        setCity(response.data)
      })
      .catch(err => {
        console.log(err)
      })
  }

  function handleCity(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(String(event.target.value))
  }

  function hangleMapClick(event: LeafletMouseEvent) {
    console.log(event.latlng)
    setSelectedPosition([event.latlng.lat, event.latlng.lng])
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
  }

  function handleSelectedItem(id: number) {
    const alreadySelectedItems = selectedItems.findIndex(e => e === id)
    if (alreadySelectedItems >= 0) {
      const filteredItems = selectedItems.filter(e => e !== id)
      setSelectedItems(filteredItems)
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const {name, email, whatsapp} = formData
    const uf = selectedUf
    const city = selectedCity
    const [latitude, longitude] = selectedPosition
    const items = selectedItems

    const data = {
      name, 
      email, 
      whatsapp,
      uf,
      city,
      latitude,
      longitude,
      items
    }
    console.log(data)
    api.post('points', data)
    .then(res => {
      alert('Ponto de coleta cadastrado!')
      history.push('/')
    })
    .catch(err => {
      alert('Ocorreu um erro tente novamente.')
    })
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
            Voltar para home
          </Link>
      </header>
      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="name">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="name">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>
          <Map center={initialPosition} zoom={15} onClick={hangleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado(UF)</label>
              <select name="uf" id="uf" value={selectedUf} onChange={getCity}>
                <option value="0">Selecione uma UF</option>
                {country.map(element => (
                  <option value={element.sigla} key={element.id}> {element.nome}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" value={selectedCity} onChange={handleCity}>
                <option value="0">Selecione uma cidade</option>
                {city.map(element => (
                  <option key={element.id} value={element.nome}>{element.nome}</option>
                ))}
              </select>
            </div>

          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(item => (
              <li
                key={item.id}
                onClick={
                  () => handleSelectedItem(item.id)
                }
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  )
}
export default CreatePoint