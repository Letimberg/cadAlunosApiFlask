from flask import Flask, render_template, request, url_for, redirect, flash
from flask_sqlalchemy import SQLAlchemy


# Configuração do Flask e do Banco de Dados
app = Flask(__name__)
app.secret_key = "Secret Key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database_alunos.db'

db = SQLAlchemy(app)


class Aluno(db.Model):
    # Configuração do nome e colunas da tabela
    __tablename__ = 'aluno'
    _id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cpf = db.Column(db.Integer)
    nome = db.Column(db.String(255))
    matricula = db.Column(db.Integer)
    data_nascimento = db.Column(db.Integer)
    sexo = db.Column(db.String(255))
    idade = db.Column(db.Integer)
    av1 = db.Column(db.Float)
    av2 = db.Column(db.Float)

    def __init__(self, cpf, nome, matricula, data_nascimento, sexo, idade, av1, av2):
        self.cpf = cpf
        self.nome = nome
        self.matricula = matricula
        self.data_nascimento = data_nascimento
        self.sexo = sexo
        self.idade = idade
        self.av1 = av1
        self.av2 = av2

    def calcular_media(self):
        return (self.av1 + self.av2) / 2


with app.app_context():
    db.create_all()


@app.route("/")
def index():
    return render_template("index.ejs")


@app.route("/cadastrar")
def cadastrar():
    alunos = Aluno.query.all()
    return render_template("cadastro.ejs", alunos=alunos)

# Cadastrar alunos


@app.route("/cadastro", methods=['GET', 'POST'])
def cadastro():
    if request.method == "POST":
        cpf = request.form.get("cpf")
        nome = request.form.get("nome")
        matricula = request.form.get("matricula")
        data_nascimento = request.form.get("data_nascimento")
        sexo = request.form.get("sexo")
        idade = request.form.get("idade")
        av1 = request.form.get("av1")
        av2 = request.form.get("av2")

        if cpf and nome and matricula and data_nascimento and sexo and idade and av1 and av2:
            al = Aluno(cpf, nome, matricula, data_nascimento,
                       sexo, idade, av1, av2)
            db.session.add(al)
            db.session.commit()

            flash("Aluno cadastrado com sucesso.")

    return redirect(url_for("cadastrar"))


# Editar alunos
@app.route("/atualizar/<int:id>", methods=['GET', 'POST'])
def atualizar(id):
    alunos = Aluno.query.filter_by(_id=id).first()

    if request.method == "POST":
        cpf = request.form.get("cpf")
        nome = request.form.get("nome")
        matricula = request.form.get("matricula")
        data_nascimento = request.form.get("data_nascimento")
        sexo = request.form.get("sexo")
        idade = request.form.get("idade")
        av1 = request.form.get("av1")
        av2 = request.form.get("av2")

        if cpf and nome and matricula and data_nascimento and sexo and idade and av1 and av2:
            alunos.cpf = cpf
            alunos.nome = nome
            alunos.matricula = matricula
            alunos.data_nascimento = data_nascimento
            alunos.sexo = sexo
            alunos.idade = idade
            alunos.av1 = av1
            alunos.av2 = av2
            db.session.commit()
            return redirect(url_for("cadastrar"))
    return render_template("cadastro.ejs", alunos=alunos)

# Excluir alunos


@app.route("/excluir/<int:id>", methods=['GET', 'POST', 'DELETE'])
def excluir(id):
    alunos = Aluno.query.filter_by(_id=id).first()

    db.session.delete(alunos)
    db.session.commit()

    alunos = Aluno.query.all()
    return render_template("cadastro.ejs", alunos=alunos)


# Inicia o servidor no localhost na porta 8080
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5555, debug=True)
