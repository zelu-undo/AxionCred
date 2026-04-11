'use client'

import { useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle,
  ArrowLeft
} from 'lucide-react'

// Templates for download
const CUSTOMER_TEMPLATE = [
  ['name', 'document', 'email', 'phone', 'address', 'city', 'state', 'notes'],
  ['João Silva', '12345678900', 'joao@email.com', '11999999999', 'Rua ABC 123', 'São Paulo', 'SP', 'ClienteVIP'],
  ['Maria Santos', '98765432100', 'maria@email.com', '11888888888', 'Av. XYZ 456', 'Rio de Janeiro', 'RJ', '']
]

const LOAN_TEMPLATE = [
  ['customer_document', 'amount', 'installments', 'interest_rate', 'status'],
  ['12345678900', '10000.00', '12', '5.0', 'active'],
  ['98765432100', '5000.00', '6', '3.0', 'active']
]

const RENEGOTIATION_TEMPLATE = [
  ['customer_document', 'original_amount', 'new_amount', 'new_installments', 'new_interest_rate', 'status'],
  ['12345678900', '15000.00', '12000.00', '12', '5.0', 'pending'],
  ['98765432100', '8000.00', '6000.00', '6', '3.0', 'pending']
]

const PAYMENT_TEMPLATE = [
  ['customer_document', 'amount', 'payment_date', 'payment_method'],
  ['12345678900', '1000.00', '2026-04-10', 'pix'],
  ['98765432100', '500.00', '2026-04-09', 'boleto']
]

export default function ImportExportPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [entityType, setEntityType] = useState<'customers' | 'loans' | 'renegotiations' | 'payments'>('customers')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [editedRows, setEditedRows] = useState<any[]>([])
  const [exportStatus, setExportStatus] = useState<string>('all')

  // Download template
  const downloadTemplate = (type: string) => {
    let data: string[][], filename: string
    
    switch (type) {
      case 'customers':
        data = CUSTOMER_TEMPLATE
        filename = 'modelo_clientes.csv'
        break
      case 'loans':
        data = LOAN_TEMPLATE
        filename = 'modelo_emprestimos.csv'
        break
      case 'renegotiations':
        data = RENEGOTIATION_TEMPLATE
        filename = 'modelo_renegociacoes.csv'
        break
      case 'payments':
        data = PAYMENT_TEMPLATE
        filename = 'modelo_pagamentos.csv'
        break
      default:
        return
    }

    const csv = data.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  // Parse CSV
  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    })
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setIsProcessing(true)
    setMessage(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)
      
      if (rows.length < 2) {
        setMessage({ type: 'error', text: 'Arquivo vazio ou sem dados!' })
        setIsProcessing(false)
        return
      }

      const headers = rows[0]
      const data = rows.slice(1).map(row => {
        const obj: any = {}
        headers.forEach((h, i) => {
          obj[h] = row[i] || ''
        })
        return obj
      })

      setImportData(data)
      setPreviewData(data.slice(0, 10))
      setEditedRows(data)
      setStep('preview')
      setMessage({ type: 'success', text: `${data.length} registros carregados!` })
    } catch (err) {
      console.error('Error parsing CSV:', err)
      setMessage({ type: 'error', text: 'Erro ao ler arquivo. Verifique o formato!' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Edit row
  const editRow = (index: number, field: string, value: string) => {
    const newRows = [...editedRows]
    newRows[index] = { ...newRows[index], [field]: value }
    setEditedRows(newRows)
    
    if (index < previewData.length) {
      const newPreview = [...previewData]
      newPreview[index] = { ...newPreview[index], [field]: value }
      setPreviewData(newPreview)
    }
  }

  // Skip row
  const skipRow = (index: number) => {
    const newRows = [...editedRows]
    newRows[index] = { ...newRows[index], _skip: !newRows[index]._skip }
    setEditedRows(newRows)
  }

  // Export data
  const handleExport = async () => {
    const tenantId = user?.tenantId
    
    if (!tenantId) return
    
    setIsProcessing(true)
    setMessage(null)

    try {
      let data: any[] = []
      let filename: string = ''

      switch (entityType) {
        case 'customers': {
          const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .eq('tenant_id', tenantId)
          
          if (exportStatus !== 'all') {
            const filtered = customers?.filter(c => c.status === exportStatus)
            data = filtered || []
          } else {
            data = customers || []
          }
          filename = 'clientes.csv'
          break
        }
        
        case 'loans': {
          const { data: loans } = await supabase
            .from('loans')
            .select('*, customer:customers(name, document)')
            .eq('tenant_id', tenantId)
          
          data = (loans || []).map(l => ({
            customer_document: l.customer?.document || '',
            customer_name: l.customer?.name || '',
            amount: l.amount,
            total_amount: l.total_amount,
            installments: l.installments,
            interest_rate: l.interest_rate,
            status: l.status,
            created_at: l.created_at
          }))
          filename = 'emprestimos.csv'
          break
        }
        
        case 'renegotiations': {
          const { data: renegotiations } = await supabase
            .from('loan_renegotiations')
            .select('*, loan:loans(customer:customers(name, document))')
            .eq('tenant_id', tenantId)
          
          data = (renegotiations || []).map(r => ({
            customer_document: r.loan?.customer?.document || '',
            original_amount: r.original_total_amount || r.new_amount,
            new_amount: r.new_amount,
            new_installments: r.new_installments,
            new_interest_rate: r.interest_rate,
            status: r.status,
            created_at: r.created_at
          }))
          filename = 'renegociacoes.csv'
          break
        }
        
        case 'payments': {
          const { data: payments } = await supabase
            .from('loan_installments')
            .select('*, loan:loans(customer:customers(name, document))')
            .eq('tenant_id', tenantId)
          
          data = (payments || []).map(p => ({
            customer_document: p.loan?.customer?.document || '',
            installment_number: p.installment_number,
            amount: p.amount,
            paid_amount: p.paid_amount,
            due_date: p.due_date,
            paid_date: p.paid_date,
            status: p.status
          }))
          filename = 'pagamentos.csv'
          break
        }
      }

      // Generate CSV
      if (data.length === 0) {
        setMessage({ type: 'error', text: 'Nenhum dado encontrado para exportar!' })
        setIsProcessing(false)
        return
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h]
          if (val === null || val === undefined) return ''
          const str = String(val)
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
        }).join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: `${data.length} registros exportados com sucesso!` })
    } catch (err) {
      console.error('Export error:', err)
      setMessage({ type: 'error', text: 'Erro ao exportar dados!' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset
  const resetImport = () => {
    setImportFile(null)
    setImportData([])
    setPreviewData([])
    setEditedRows([])
    setStep('upload')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importar / Exportar Dados</h1>
          <p className="text-gray-500">Importe ou exporte dados via planilha</p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'import' | 'export')}>
        <TabsList>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* IMPORT TAB */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Dados</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Clientes</SelectItem>
                    <SelectItem value="loans">Empréstimos</SelectItem>
                    <SelectItem value="renegotiations">Renegociações</SelectItem>
                    <SelectItem value="payments">Pagamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {step === 'upload' && (
                <div className="space-y-4">
                  <div className="p-4 border-2 border-dashed rounded-lg text-center space-y-4">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-gray-600">Arraste um arquivo CSV ou clique para selecionar</p>
                      <p className="text-sm text-gray-400">Formatos aceitos: CSV</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Selecionar Arquivo
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Baixar Modelo:</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadTemplate(entityType)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Modelo CSV
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      O modelo contém exemplos de como preencher a planilha. A primeira linha deve ter os encabezos das colunas.
                    </p>
                  </div>
                </div>
              )}

              {step === 'preview' && importData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={resetImport}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Novo Arquivo
                      </Button>
                      <span className="text-sm text-gray-500">
                        {importData.length} registros encontrados
                      </span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left w-12">Status</th>
                          {Object.keys(previewData[0] || {}).map(key => (
                            <th key={key} className="px-2 py-2 text-left">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className={`border-t ${editedRows[idx]?._skip ? 'bg-gray-100 opacity-50' : ''}`}>
                            <td className="px-2 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => skipRow(idx)}
                                className={editedRows[idx]?._skip ? 'text-red-600' : 'text-green-600'}
                              >
                                {editedRows[idx]?._skip ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                            {Object.entries(row).map(([key, value]) => (
                              <td key={key} className="px-2 py-2">
                                <input
                                  type="text"
                                  value={value as string}
                                  onChange={(e) => editRow(idx, key, e.target.value)}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-sm text-gray-500">
                    Mostrando 5 de {importData.length} registros. Você pode editar os valores diretamente na tabela acima.
                    Linhas em vermelho serão ignoradas na importação.
                  </p>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // In production, you would save to DB here
                        const validRows = editedRows.filter(r => !r._skip)
                        setMessage({ 
                          type: 'success', 
                          text: `${validRows.length} registros prontos para importação! (funcionalidade em desenvolvimento)` 
                        })
                        setStep('upload')
                        resetImport()
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Importação
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPORT TAB */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportar Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Dados</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Clientes</SelectItem>
                    <SelectItem value="loans">Empréstimos</SelectItem>
                    <SelectItem value="renegotiations">Renegociações</SelectItem>
                    <SelectItem value="payments">Pagamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {entityType === 'customers' && (
                <div>
                  <Label>Filtrar por Status</Label>
                  <Select value={exportStatus} onValueChange={setExportStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Informações Exportadas:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {entityType === 'customers' && (
                    <>
                      <li>• Nome, documento, email, telefone, endereço, cidade, estado, status</li>
                    </>
                  )}
                  {entityType === 'loans' && (
                    <>
                      <li>• Documento do cliente, nome, valor, total, parcelas, taxa de juros, status</li>
                    </>
                  )}
                  {entityType === 'renegotiations' && (
                    <>
                      <li>• Documento do cliente, valor original, novo valor, parcelas, taxa, status</li>
                    </>
                  )}
                  {entityType === 'payments' && (
                    <>
                      <li>• Documento do cliente, número da parcela, valor, pago, datas</li>
                    </>
                  )}
                </ul>
              </div>

              <Button 
                onClick={handleExport}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>Processando...</>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar {entityType === 'customers' ? 'Clientes' : 
                           entityType === 'loans' ? 'Empréstimos' : 
                           entityType === 'renegotiations' ? 'Renegociações' : 'Pagamentos'}
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Apenas dados da sua empresa serão exportados
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}